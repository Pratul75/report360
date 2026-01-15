# CLIENT DELETE SYSTEM - TESTING GUIDE

## ⚠️ CRITICAL: TEST FIRST, THEN APPLY TO PRODUCTION

This guide provides step-by-step instructions for testing the Safe Client Delete system before using it on real data.

---

## 🎯 Testing Objectives

1. ✅ Verify cascade delete works correctly
2. ✅ Ensure only target client data is deleted
3. ✅ Confirm other clients/projects remain untouched
4. ✅ Validate no system errors occur
5. ✅ Check frontend UI updates correctly

---

## 📋 Pre-Testing Checklist

Before starting tests:

- [ ] Backend is running (Docker containers up)
- [ ] Frontend is running (npm start)
- [ ] You are logged in as **Admin user**
- [ ] Database backup is available (safety measure)

---

## 🧪 TEST SCENARIO 1: Create Test Data

### Step 1.1: Create Test Client

**Frontend Steps:**
1. Navigate to **Clients** page
2. Click "Add Client" button
3. Fill in test data:
   - Name: `TEST_CLIENT_DELETE_ME`
   - Company: `Test Company DELETE`
   - Email: `test_delete@example.com`
   - Phone: `9999999999`
   - Contact Person: `Test Contact`
4. Click "Create"
5. ✅ **Verify:** Client appears in clients list

### Step 1.2: Create Test Projects

**For the test client created above:**
1. Navigate to **Projects** page
2. Click "Add Project"
3. Fill in:
   - Name: `TEST_PROJECT_1_DELETE`
   - Client: Select `TEST_CLIENT_DELETE_ME`
   - Description: `Test project for delete testing`
   - Budget: `10000`
   - Status: `active`
4. Click "Create"
5. Repeat to create `TEST_PROJECT_2_DELETE`
6. ✅ **Verify:** Both projects appear under test client

### Step 1.3: Create Test Campaigns

**For each test project:**
1. Navigate to **Campaigns** page
2. Click "Add Campaign"
3. Fill in:
   - Name: `TEST_CAMPAIGN_DELETE`
   - Project: Select `TEST_PROJECT_1_DELETE`
   - Type: `BTL`
   - Status: `planning`
   - Budget: `5000`
4. Click "Create"
5. Repeat for `TEST_PROJECT_2_DELETE`
6. ✅ **Verify:** Campaigns appear under test projects

### Step 1.4: Create Related Data (Optional but Recommended)

**For complete testing, create:**
- 1-2 Expenses under test campaigns
- 1 Report under test campaign
- 1 Invoice linked to test campaign
- 1 Promoter Activity under test campaign

✅ **Checkpoint:** You now have a complete test data tree

---

## 🧪 TEST SCENARIO 2: Test Deletion Preview

### Step 2.1: Check Deletion Preview

**Frontend Steps:**
1. Go to **Clients** page
2. Find `TEST_CLIENT_DELETE_ME`
3. Click the **Trash icon** (🗑️)
4. ✅ **Verify:** Modal appears showing:
   - Client name
   - Count of projects (should be 2)
   - Count of campaigns (should be 2+)
   - Count of expenses, reports, etc.
   - Total affected records

### Step 2.2: Verify Preview Accuracy

**Check the numbers match your created data:**
- Projects count = 2
- Campaigns count = 2 (or more if you created more)
- Expenses count = what you created
- Reports count = what you created

✅ **Expected:** Preview shows accurate counts

---

## 🧪 TEST SCENARIO 3: Execute Safe Delete

### Step 3.1: Cancel Delete (Safety Test)

1. In the confirmation modal, click "Cancel"
2. ✅ **Verify:** Modal closes, no data deleted
3. ✅ **Verify:** Test client still appears in list

### Step 3.2: Execute Delete

1. Click **Trash icon** again on test client
2. Read the warning message carefully
3. Click "Yes, Delete Everything"
4. ✅ **Verify:** Success toast appears with deletion summary
5. ✅ **Verify:** Modal closes

---

## 🧪 TEST SCENARIO 4: Verify Cascade Delete Worked

### Step 4.1: Check Client List

**Frontend:**
1. Stay on **Clients** page
2. ✅ **Verify:** `TEST_CLIENT_DELETE_ME` is **NOT** in the list
3. ✅ **Verify:** Other clients still appear normally

### Step 4.2: Check Projects List

**Frontend:**
1. Navigate to **Projects** page
2. ✅ **Verify:** `TEST_PROJECT_1_DELETE` is **NOT** visible
3. ✅ **Verify:** `TEST_PROJECT_2_DELETE` is **NOT** visible
4. ✅ **Verify:** Other projects still appear normally

### Step 4.3: Check Campaigns List

**Frontend:**
1. Navigate to **Campaigns** page
2. ✅ **Verify:** `TEST_CAMPAIGN_DELETE` campaigns are **NOT** visible
3. ✅ **Verify:** Other campaigns still appear normally

### Step 4.4: Check Related Data

**If you created expenses/reports:**
1. Navigate to **Expenses** page
2. ✅ **Verify:** Test expenses are **NOT** visible
3. Navigate to **Reports** page
4. ✅ **Verify:** Test reports are **NOT** visible

---

## 🧪 TEST SCENARIO 5: Database Verification (Backend)

### Step 5.1: Check Database Records

**Connect to MySQL:**
```bash
docker exec -it fleet_mysql mysql -u root -p
# Password: rootpassword

USE fleet_operations;
```

**Check client is soft-deleted:**
```sql
SELECT id, name, is_active FROM clients WHERE name = 'TEST_CLIENT_DELETE_ME';
```
✅ **Expected:** `is_active = 0`

**Check projects are soft-deleted:**
```sql
SELECT id, name, is_active, client_id FROM projects 
WHERE name LIKE 'TEST_PROJECT%DELETE';
```
✅ **Expected:** All have `is_active = 0`

**Check campaigns are soft-deleted:**
```sql
SELECT id, name, is_active FROM campaigns 
WHERE name LIKE 'TEST_CAMPAIGN%DELETE';
```
✅ **Expected:** All have `is_active = 0`

### Step 5.2: Verify Data Integrity

**Check no hard deletes occurred:**
```sql
-- Records should still exist in database
SELECT COUNT(*) FROM clients WHERE name = 'TEST_CLIENT_DELETE_ME';
```
✅ **Expected:** Count > 0 (record exists but is_active=0)

**Check foreign keys intact:**
```sql
SELECT p.id, p.name, p.client_id, c.name as client_name
FROM projects p
LEFT JOIN clients c ON p.client_id = c.id
WHERE p.name LIKE 'TEST_PROJECT%DELETE';
```
✅ **Expected:** Foreign keys still valid

---

## 🧪 TEST SCENARIO 6: Check System Stability

### Step 6.1: Navigate All Pages

**Visit each page and verify no errors:**
- [ ] Dashboard
- [ ] Clients
- [ ] Projects  
- [ ] Campaigns
- [ ] Expenses
- [ ] Reports
- [ ] Drivers
- [ ] Vehicles
- [ ] Vendors

✅ **Expected:** All pages load without errors

### Step 6.2: Check Console

**Browser Console:**
- Open Developer Tools → Console
- ✅ **Verify:** No red errors
- ✅ **Verify:** No failed API calls

**Backend Logs:**
```bash
docker compose logs backend | grep -i error
```
✅ **Expected:** No deletion-related errors

---

## 🧪 TEST SCENARIO 7: Test Non-Admin User (Security)

### Step 7.1: Login as Non-Admin

1. Logout current user
2. Login as user with role other than Admin
   - Try: operations_manager, client_servicing, vendor, driver

### Step 7.2: Verify Delete Button Hidden

1. Navigate to **Clients** page
2. ✅ **Verify:** Trash icon (🗑️) is **NOT visible** on any client
3. ✅ **Expected:** Only Admin can see delete button

### Step 7.3: Test API Security (Optional)

**If you have API testing tools (Postman/curl):**
```bash
# Try to delete as non-admin (should fail)
curl -X DELETE http://localhost:8000/api/v1/clients/1 \
  -H "Authorization: Bearer <non_admin_token>"
```
✅ **Expected:** 403 Forbidden error

---

## ✅ TEST COMPLETION CHECKLIST

After completing all scenarios above:

- [ ] Test client deleted successfully
- [ ] All related projects deleted
- [ ] All related campaigns deleted
- [ ] All related data (expenses/reports) deleted
- [ ] Other clients/projects unaffected
- [ ] No system errors occurred
- [ ] Frontend UI updated correctly
- [ ] Database records soft-deleted (is_active=0)
- [ ] Foreign keys intact
- [ ] Non-admin users cannot delete
- [ ] All pages work normally

---

## 🎉 SUCCESS CRITERIA

**The system passes testing if:**

1. ✅ Test data completely hidden from frontend
2. ✅ Database records exist but marked inactive
3. ✅ No orphan data visible in any view
4. ✅ Other clients/projects work normally
5. ✅ ZERO runtime errors
6. ✅ Only admins can delete
7. ✅ Deletion preview shows accurate counts
8. ✅ Success message confirms what was deleted

---

## 🚨 IF TESTS FAIL

**Do NOT use on production data until:**

1. Identify the failure point
2. Check backend logs: `docker compose logs backend`
3. Check database state
4. Report issue with:
   - What step failed
   - Error message
   - Browser console logs
   - Backend logs

**Recovery:**
- Restore database from backup if needed
- Test client data can be manually set is_active=1 to restore

---

## 📊 PRODUCTION USAGE GUIDELINES

**After successful testing:**

### Before Deleting Real Clients:

1. ✅ Backup database
2. ✅ Verify client is correct one to delete
3. ✅ Review deletion preview carefully
4. ✅ Confirm all numbers make sense
5. ✅ Understand data cannot be recovered easily

### Best Practices:

- Always check deletion preview first
- Double-check client name
- Verify with stakeholders if large data volume
- Keep deletion confirmation screenshots
- Monitor system after deletion

---

## 🔧 Manual Recovery (If Needed)

**To undo a deletion (emergency only):**

```sql
-- Restore client
UPDATE clients SET is_active = 1 WHERE id = <client_id>;

-- Restore projects
UPDATE projects SET is_active = 1 WHERE client_id = <client_id>;

-- Restore campaigns (get project IDs first)
UPDATE campaigns SET is_active = 1 
WHERE project_id IN (SELECT id FROM projects WHERE client_id = <client_id>);

-- Restore related data similarly
```

⚠️ **Note:** Manual recovery should be last resort. Test thoroughly to avoid need.

---

## 📞 Support

If you encounter issues during testing:

1. Check this guide again
2. Review backend logs
3. Check database state
4. Document the issue with screenshots
5. Contact development team

---

## ✅ FINAL SIGN-OFF

**Before using in production:**

Tester Name: ________________

Date: ________________

All tests passed: [ ] YES [ ] NO

Comments: ______________________________

---

**Remember: TEST FIRST, PRODUCTION LATER! 🎯**
