#!/bin/bash
# Smoke test for the new Link Logger integration endpoint.
# Run AFTER: env vars set in Render Dashboard + auto-deploy finished.
#
#   API_URL=https://task-manager-api-oej2.onrender.com \
#     bash test_link_logger.sh

set -e
API_URL="${API_URL:-http://localhost:8080}"
echo "=== Link Logger Integration Smoke Test ==="
echo "API_URL=$API_URL"
echo ""

# 1. Register a fresh user
USERNAME="ll_$(date +%s)"
REG=$(curl -s -X POST "$API_URL/api/auth/register" \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0" \
  -H "Origin: http://localhost:8080" \
  -d "{\"username\":\"$USERNAME\",\"email\":\"$USERNAME@test.local\",\"password\":\"lltestpass123\"}")
echo "1. Register: $(echo "$REG" | head -c 60)..."
TOKEN=$(echo "$REG" | python3 -c "import json,sys; print(json.load(sys.stdin)['token'])")
echo "   ✓ Token acquired"
echo ""

# 2. Create a project
PROJ=$(curl -s -X POST "$API_URL/api/projects" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8080" \
  -d '{"name":"Link Logger Smoke","description":"created by integration smoke test"}')
PID=$(echo "$PROJ" | python3 -c "import json,sys; print(json.load(sys.stdin)['id'])")
echo "2. Create project: id=$PID"
echo ""

# 3. Create a real link in Link Logger (unique short_code per run)
RAND=$(date +%s | tail -c 7)
echo "3. Create a link in Link Logger to test against..."
LL=$(curl -s -X POST https://link-logger-api.onrender.com/api/links \
  -H "Content-Type: application/json" \
  -d "{\"original_url\":\"https://github.com/FrozenProduction/task-manager\",\"custom_code\":\"ll$RAND\"}")
echo "   $LL"
LID=$(echo "$LL" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d.get('id') or d.get('detail', 'NO_ID'))")
echo "   Link Logger ID: $LID"
echo ""

# 4. Create task WITH linkLoggerLinkId
echo "4. POST /api/tasks with linkLoggerLinkId=$LID..."
TASK=$(curl -s -X POST "$API_URL/api/tasks" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8080" \
  -d "{\"title\":\"Task with Link Logger attach\",\"description\":\"smoke test\",\"status\":\"TODO\",\"projectId\":$PID,\"linkLoggerLinkId\":$LID}")
echo "   Response: $TASK"
echo ""

# 5. Verify link data was snapshotted
echo "$TASK" | python3 -c "
import json,sys
d=json.load(sys.stdin)
print('  sourceLinkShortCode:', d.get('sourceLinkShortCode', 'MISSING'))
print('  sourceLinkUrl:', (d.get('sourceLinkUrl') or '')[:60] + '...' if d.get('sourceLinkUrl') else 'MISSING')
print('  sourceLinkShortUrl:', d.get('sourceLinkShortUrl', 'MISSING'))
print('  sourceLinkClicksAtImport:', d.get('sourceLinkClicksAtImport', 'MISSING'))
print('  title:', d.get('title', 'MISSING')[:60])
"

if echo "$TASK" | grep -q "\"sourceLinkShortCode\":\"ll$RAND\""; then
  echo ""
  echo "   ✓✓✓ Link Logger integration WORKING ✓✓✓"
else
  echo ""
  echo "   ✗✗✗ Link data NOT snapshotted. Check:"
  echo "      1. Render env vars LINK_LOGGER_API_URL + LINK_LOGGER_PUBLIC_BASE_URL are set"
  echo "      2. Auto-deploy finished after env var change"
  echo "      3. Link Logger not in cold start (cold start = 30-50s, retry)"
  # Cleanup even on failure
  curl -s -o /dev/null -X DELETE "$API_URL/api/projects/$PID" \
    -H "Authorization: Bearer $TOKEN" \
    -H "Origin: http://localhost:8080"
  exit 1
fi

# Cleanup
curl -s -o /dev/null -X DELETE "$API_URL/api/projects/$PID" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Origin: http://localhost:8080"
curl -s -o /dev/null -X DELETE "https://link-logger-api.onrender.com/api/links/$LID"
echo ""
echo "   Cleanup done (project + link deleted)."
