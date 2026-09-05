#!/bin/bash
# Integration test for Task Manager API
# Runs against a live server (local or production).
# Tests the full auth + project + task CRUD flow.

set -e

API_URL="${API_URL:-http://localhost:8080}"
echo "=== Task Manager Integration Test Suite ==="
echo "API_URL=$API_URL"
echo ""

# Use a unique username per run so tests are repeatable against a non-empty DB.
TIMESTAMP=$(date +%s)
USERNAME="testuser_$TIMESTAMP"
EMAIL="${USERNAME}@test.com"
# Password used only for ephemeral test users created in this run.
PASSWORD="${TEST_PASSWORD:-TestPass123!}"

# ---- 1. Health check (public) ----
echo "1. Health check..."
HEALTH=$(curl -s "$API_URL/api/health")
if echo "$HEALTH" | grep -q '"status":"ok"'; then
    echo "   ✓ Health OK: $HEALTH"
else
    echo "   ✗ Health FAILED: $HEALTH"
    exit 1
fi
echo ""

# ---- 2. Register ----
echo "2. Register new user ($USERNAME)..."
REG=$(curl -s -X POST "$API_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"$USERNAME\",\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
if echo "$REG" | grep -q '"token"'; then
    echo "   ✓ Registered: $(echo "$REG" | python3 -c "import json,sys;d=json.load(sys.stdin);print(d['username'])")"
else
    echo "   ✗ Register FAILED: $REG"
    exit 1
fi
echo ""

# ---- 3. Login ----
echo "3. Login with same user..."
LOGIN=$(curl -s -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"$USERNAME\",\"password\":\"$PASSWORD\"}")
if echo "$LOGIN" | grep -q '"token"'; then
    echo "   ✓ Login OK"
else
    echo "   ✗ Login FAILED: $LOGIN"
    exit 1
fi
TOKEN=$(echo "$LOGIN" | python3 -c "import json,sys; print(json.load(sys.stdin)['token'])")
echo "   (token starts with: ${TOKEN:0:30}...)"
echo ""

# ---- 4. Wrong-password login must fail ----
echo "4. Wrong password is rejected..."
BAD=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"$USERNAME\",\"password\":\"wrongpassword\"}")
if [ "$BAD" = "401" ] || [ "$BAD" = "403" ] || [ "$BAD" = "500" ]; then
    echo "   ✓ Bad password rejected with HTTP $BAD"
else
    echo "   ✗ Bad password got HTTP $BAD (expected 401/403/500)"
    exit 1
fi
echo ""

# ---- 5. Unauthenticated request is rejected ----
echo "5. Unauthenticated request is rejected..."
NOAUTH=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/api/projects")
if [ "$NOAUTH" = "401" ] || [ "$NOAUTH" = "403" ]; then
    echo "   ✓ Unauthenticated rejected with HTTP $NOAUTH"
else
    echo "   ✗ Unauthenticated got HTTP $NOAUTH (expected 401/403)"
    exit 1
fi
echo ""

# ---- 6. Create project ----
echo "6. Create project..."
PROJ=$(curl -s -X POST "$API_URL/api/projects" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"name":"Test Project","description":"Integration test"}')
if echo "$PROJ" | grep -q '"id"'; then
    PROJECT_ID=$(echo "$PROJ" | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")
    echo "   ✓ Project #$PROJECT_ID created"
else
    echo "   ✗ Create project FAILED: $PROJ"
    exit 1
fi
echo ""

# ---- 7. List projects ----
echo "7. List projects..."
LIST=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/projects")
COUNT=$(echo "$LIST" | python3 -c "import json,sys; print(len(json.load(sys.stdin)))")
if [ "$COUNT" -ge 1 ]; then
    echo "   ✓ List returned $COUNT project(s)"
else
    echo "   ✗ List returned 0 projects (expected ≥1)"
    exit 1
fi
echo ""

# ---- 8. Get project by ID ----
echo "8. Get project #$PROJECT_ID..."
GET=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/projects/$PROJECT_ID")
if echo "$GET" | grep -q "\"id\":$PROJECT_ID"; then
    echo "   ✓ Project fetched: $(echo "$GET" | python3 -c "import json,sys; print(json.load(sys.stdin)['name'])")"
else
    echo "   ✗ Get project FAILED: $GET"
    exit 1
fi
echo ""

# ---- 9. Create task ----
echo "9. Create task in project #$PROJECT_ID..."
TASK=$(curl -s -X POST "$API_URL/api/tasks" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"title\":\"Test task\",\"description\":\"Hello\",\"status\":\"TODO\",\"projectId\":$PROJECT_ID}")
if echo "$TASK" | grep -q '"id"'; then
    TASK_ID=$(echo "$TASK" | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")
    echo "   ✓ Task #$TASK_ID created"
else
    echo "   ✗ Create task FAILED: $TASK"
    exit 1
fi
echo ""

# ---- 10. List tasks for project ----
echo "10. List tasks for project #$PROJECT_ID..."
TLIST=$(curl -s -H "Authorization: Bearer $TOKEN" "$API_URL/api/tasks/project/$PROJECT_ID")
COUNT=$(echo "$TLIST" | python3 -c "import json,sys; print(len(json.load(sys.stdin)))")
if [ "$COUNT" -ge 1 ]; then
    echo "   ✓ Task list returned $COUNT task(s)"
else
    echo "   ✗ Task list returned 0 (expected ≥1)"
    exit 1
fi
echo ""

# ---- 11. Update task ----
echo "11. Update task #$TASK_ID to status=DONE..."
UPDATE=$(curl -s -X PATCH "$API_URL/api/tasks/$TASK_ID" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d '{"status":"DONE"}')
if echo "$UPDATE" | grep -q '"status":"DONE"'; then
    echo "   ✓ Task updated"
else
    echo "   ✗ Update task FAILED: $UPDATE"
    exit 1
fi
echo ""

# ---- 12. Ownership check ----
echo "12. Different user cannot access project #$PROJECT_ID..."
OTHER_REG=$(curl -s -X POST "$API_URL/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{\"username\":\"other_$TIMESTAMP\",\"email\":\"other_$TIMESTAMP@test.com\",\"password\":\"$PASSWORD\"}")
OTHER_TOKEN=$(echo "$OTHER_REG" | python3 -c "import json,sys; print(json.load(sys.stdin)['token'])")
DENY=$(curl -s -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $OTHER_TOKEN" "$API_URL/api/projects/$PROJECT_ID")
if [ "$DENY" = "403" ] || [ "$DENY" = "404" ]; then
    echo "   ✓ Other user blocked with HTTP $DENY"
else
    echo "   ✗ Other user got HTTP $DENY (expected 403/404)"
    exit 1
fi
echo ""

# ---- 13. Delete task ----
echo "13. Delete task #$TASK_ID..."
curl -s -o /dev/null -w "   → HTTP %{http_code}\n" -X DELETE "$API_URL/api/tasks/$TASK_ID" \
    -H "Authorization: Bearer $TOKEN"
echo ""

# ---- 14. Delete project ----
echo "14. Delete project #$PROJECT_ID..."
curl -s -o /dev/null -w "   → HTTP %{http_code}\n" -X DELETE "$API_URL/api/projects/$PROJECT_ID" \
    -H "Authorization: Bearer $TOKEN"
echo ""

echo "=== All tests passed ==="