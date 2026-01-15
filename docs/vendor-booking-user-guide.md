# Vendor Driver Booking - User Guide

## 📖 Quick Start Guide

### For Vendors

#### How to Assign a Driver to Campaign Work

1. **Login** to your vendor account
2. Navigate to **Vendor Dashboard**
3. Click on **Campaigns** tab
4. Find your assigned campaign
5. Click **"Assign Driver"** button
6. Fill in the form:
   - **Select Driver** (from your drivers)
   - **Select Vehicle** (from your vehicles)
   - **Work Title** (e.g., "Product Sampling")
   - **Work Description** (detailed task description)
   - **Village Name** (e.g., "Rampur")
   - **Location Address** (full address)
   - **Assignment Date** (when work should be done)
   - **Expected Start Time** (e.g., 09:00)
   - **Expected End Time** (e.g., 17:00)
   - **Remarks** (optional notes)
7. Click **Submit**
8. Assignment appears in the list below the campaign

#### View Assignments

- Assignments are displayed below each campaign
- Shows: Driver name, vehicle number, work title, location, time, status
- Auto-refreshes every 30 seconds
- Color-coded status badges:
  - 🔵 Blue = ASSIGNED (new)
  - 🟡 Yellow = IN_PROGRESS (driver started)
  - 🟢 Green = COMPLETED
  - 🔴 Red = CANCELLED

#### Update or Cancel Assignment

*(Coming soon in future updates)*

---

### For Drivers

#### How to View Your Work Assignments

1. **Login** to your driver account
2. Navigate to **Driver Dashboard**
3. Scroll to **"My Work Assignments"** section
4. See all assignments with:
   - Campaign name
   - Work title and description
   - Village name and location
   - Expected start/end time
   - Vehicle assigned to you
   - Current status

#### What You See

- **Assignment Card** for each work item
- **Location Info** with village and full address
- **Time Window** showing expected start and end time
- **Vehicle Details** assigned for the work
- **Status Badge** showing current state

**Note:** Drivers have read-only access. Contact your vendor/manager to update assignments.

---

### For Admins

#### Full Access Control

As an admin, you have complete visibility and control:

1. **View All Vendors' Assignments**
   - Access any vendor's data
   - Use admin panel or API endpoints

2. **Override Vendor Scoping**
   - Use query parameter: `?vendor_id=X`
   - Create/update/cancel any assignment

3. **Monitor System**
   - Check backend logs
   - Monitor database
   - Review API usage

---

## 🔍 Understanding Statuses

| Status | Meaning | Who Can Set |
|--------|---------|-------------|
| **ASSIGNED** | Work is assigned, driver hasn't started | Vendor (on creation) |
| **IN_PROGRESS** | Driver has started the work | Driver (via mobile/dashboard) |
| **COMPLETED** | Work is finished | Driver (via mobile/dashboard) |
| **CANCELLED** | Assignment cancelled | Vendor/Admin |

---

## 📱 Typical Workflow

### Vendor Side
```
1. Vendor logs in
2. Goes to Campaigns tab
3. Sees active campaigns
4. Clicks "Assign Driver" on a campaign
5. Selects driver and vehicle
6. Fills work details (what, where, when)
7. Submits form
8. Assignment created ✅
9. Driver gets notified (future enhancement)
```

### Driver Side
```
1. Driver logs in
2. Opens Driver Dashboard
3. Sees "My Work Assignments"
4. Views today's work:
   - What to do (work title/description)
   - Where to go (village, address)
   - When to be there (start/end time)
   - Which vehicle to use
5. Goes to location
6. Marks work as started (future enhancement)
7. Completes work
8. Marks as completed (future enhancement)
```

---

## ❓ FAQs

**Q: Can I assign a driver who doesn't belong to my vendor?**  
A: No, the system only shows your own drivers and vehicles for security.

**Q: Can I assign work for past dates?**  
A: No, you can only create assignments for today or future dates.

**Q: Can drivers edit their assignments?**  
A: No, drivers have read-only access. Only vendors and admins can modify assignments.

**Q: How often does the assignment list refresh?**  
A: Automatically every 30 seconds to show real-time updates.

**Q: What if I select a vehicle that's already assigned?**  
A: The system currently allows it. Vehicle availability tracking is a future enhancement.

**Q: Can I assign multiple drivers to the same campaign?**  
A: Yes! You can create multiple assignments for the same campaign with different drivers.

**Q: How do I cancel an assignment?**  
A: Use the cancel endpoint via API or wait for the cancel button in the UI (coming soon).

---

## 🔧 Troubleshooting

### "Driver does not belong to your vendor account"

**Cause:** You tried to assign a driver from another vendor.  
**Solution:** Select a driver from the dropdown (only your drivers are shown).

### "Vehicle does not belong to your vendor account"

**Cause:** You tried to assign a vehicle from another vendor.  
**Solution:** Select a vehicle from the dropdown (only your vehicles are shown).

### "Campaign not found"

**Cause:** Campaign ID is invalid or campaign was deleted.  
**Solution:** Refresh the page and try again.

### Assignment not showing up

**Cause:** May be filtered by date or campaign.  
**Solution:** 
- Check the selected date
- Check if filtering by specific campaign
- Wait 30 seconds for auto-refresh

### "Failed to assign driver"

**Cause:** Form validation failed or network error.  
**Solution:**
- Check all required fields are filled
- Ensure date is today or future
- Check your internet connection
- Check browser console for errors

---

## 📞 Support

For technical issues:
1. Check browser console (F12)
2. Check backend logs: `docker compose logs backend`
3. Verify database connection
4. Contact system administrator

---

## 🎯 Tips for Best Results

### For Vendors

✅ **DO:**
- Provide clear work titles (e.g., "Product Sampling at Market")
- Include detailed work descriptions
- Specify exact location with landmarks
- Set realistic time windows
- Add remarks for special instructions

❌ **DON'T:**
- Create duplicate assignments
- Assign past dates
- Leave location fields empty
- Set unrealistic time windows

### For Drivers

✅ **DO:**
- Check dashboard regularly for new assignments
- Note the location and time carefully
- Arrive at expected start time
- Complete work within time window

❌ **DON'T:**
- Ignore assigned work
- Miss the time window without informing
- Use wrong vehicle

---

## 📊 System Limits

- **Assignment Date:** Must be today or future
- **Work Title:** Max 255 characters
- **Time Format:** HH:MM (24-hour format)
- **Status Values:** ASSIGNED, IN_PROGRESS, COMPLETED, CANCELLED
- **Auto-refresh:** Every 30 seconds

---

## 🚀 Coming Soon

Future enhancements planned:

- [ ] In-app notifications for drivers
- [ ] Mobile app for drivers
- [ ] GPS tracking during assignment
- [ ] Bulk assignment creation
- [ ] Assignment templates
- [ ] Performance analytics
- [ ] Driver feedback on assignments
- [ ] Photo upload for completed work
- [ ] Real-time chat between vendor and driver
- [ ] Assignment calendar view

---

## 📝 Examples

### Example 1: Product Sampling Assignment

**Work Title:** Product Sampling at Village Market  
**Work Description:** Distribute product samples to customers at the village market. Collect feedback forms and return completed forms to office.  
**Village Name:** Rampur  
**Location Address:** Main Market Road, Near Bus Stand, Rampur  
**Date:** 2026-01-10  
**Start Time:** 09:00  
**End Time:** 17:00  
**Vehicle:** MP47 MB 4045  
**Remarks:** Bring 500 sample packs and feedback forms

### Example 2: Brand Promotion

**Work Title:** Brand Promotion Campaign  
**Work Description:** Set up promotional booth at mall, demonstrate product features, and engage with potential customers.  
**Village Name:** Shivpuri  
**Location Address:** City Center Mall, Ground Floor, Shivpuri  
**Date:** 2026-01-10  
**Start Time:** 10:00  
**End Time:** 18:00  
**Vehicle:** VEH23512  
**Remarks:** Booth materials will be provided by mall staff

### Example 3: Village Fair Demo

**Work Title:** Product Demo at Village Fair  
**Work Description:** Demonstrate product features at village fair, answer questions, and collect contact information of interested customers.  
**Village Name:** Khargone  
**Location Address:** Village Fair Ground, Near Temple, Khargone  
**Date:** 2026-01-11  
**Start Time:** 08:00  
**End Time:** 16:00  
**Vehicle:** VEH23512  
**Remarks:** Fair starts at 8 AM, arrive early for setup

---

**Last Updated:** January 9, 2026  
**Version:** 1.0.0
