# Pink Pocket

Create a simple, clean, mobile-friendly Daily Expense Tracker web app with a soft, elegant pink theme. The app should be extremely easy to use for daily personal expense tracking, with minimal clutter and clear date-wise, weekly, and monthly summaries.

Main Goal

The user should be able to:

Quickly add a daily expense

View expenses date-wise

See total expenses for the current day

See total expenses for the current week

See total expenses for the current month

Filter expenses by date, week, and month

Easily understand where money is being spent

Design & Theme

Primary theme: soft pink

Use a combination of light pink, white, and subtle darker pink accents

Clean modern cards with slightly rounded corners

Soft shadows

Simple typography

Avoid excessive animations

No complicated dashboard

Mobile-first and responsive

Make it look elegant but practical for everyday use

Use clear icons for expense categories

Keep buttons large enough for easy mobile use

Header

Top header:
Daily Expense Tracker

Subtitle:
Track your spending. Stay in control.

Add a small calendar/date icon.

Dashboard

At the top, show 3 simple summary cards:

Today

₹0
Total spent today

This Week

₹0
Total spent this week

This Month

₹0
Total spent this month

Use pink highlights for the important numbers.

Add Expense Section

Create a prominent + Add Expense button.

When clicked, open a simple form/modal with:

Amount ₹

Date

Category

Description / Note

Payment Method

Category dropdown

Include:

Food

Travel

Shopping

Bills

Entertainment

Health

Education

Groceries

Other

Payment Method

Cash

UPI

Debit Card

Credit Card

Other

Add a large Save Expense button.

After saving:

Show a small success message

Immediately update the totals

Add the expense to the expense list

Expense List

Create a section titled:

Recent Expenses

Display expenses in a clean list.

Each expense should show:

Date

Category icon

Description

Payment method

Amount

Example:

19 Aug 2026
🍔 Food
Lunch
UPI
₹250

19 Aug 2026
🛍️ Shopping
Clothes
Card
₹1,200

Group expenses by date.

Example:

Today — 19 Aug

Total: ₹1,450

Expense entries underneath.

Then:

Yesterday — 18 Aug

Total: ₹850

This makes the expense history easy to understand.

Date / Time Filters

Add a simple filter/navigation section with:

Day | Week | Month

Day

Show expenses for the selected date.

Include:

Date picker

Total expense for that date

All expenses for that date

Week

Show:

Selected week

Total weekly expense

Daily breakdown

Example:

Mon — ₹500
Tue — ₹250
Wed — ₹800
Thu — ₹300
Fri — ₹450
Sat — ₹700
Sun — ₹200

Month

Show:

Selected month

Total monthly expense

Date-wise expense breakdown

Category-wise breakdown

Example:

August 2026

1 Aug — ₹500
2 Aug — ₹250
3 Aug — ₹1,200
4 Aug — ₹300

Monthly Summary

Create a simple Monthly Summary card.

Show:

August 2026

Total Expense:
₹12,450

Number of Transactions:
42

Average Daily Expense:
₹402

Also show a simple category breakdown:

Food — ₹3,200
Shopping — ₹2,500
Travel — ₹1,800
Bills — ₹2,100
Other — ₹2,850

Use a simple pink progress bar or small chart. Do not make the chart complicated.

Navigation

Use a simple bottom navigation on mobile:

🏠 Home
➕ Add
📅 History
📊 Summary

On desktop, convert this into a simple sidebar or top navigation.

History Page

Create a dedicated Expense History page.

Features:

Date filter

Week filter

Month filter

Category filter

Payment method filter

Search expenses

Sort by newest/oldest

Show total for the filtered results

Keep filtering very simple and intuitive.

Data Handling

Store every expense with:

Expense ID

Amount

Date

Category

Description

Payment Method

Created At

Expenses must remain saved after refreshing the page.

Use local storage initially so the app works without requiring a backend.

Structure the code so a database such as Supabase or Firebase can be connected later if required.

Calculations

Automatically calculate:

Today's total

Selected date total

Current week's total

Selected week's total

Current month's total

Selected month's total

Category totals

Number of transactions

Average daily expense

All calculations should update automatically whenever an expense is added, edited, or deleted.

Edit & Delete

Every expense should have a small three-dot menu or action buttons:

Edit

Delete

Before deleting, show a simple confirmation popup.

Empty State

If there are no expenses:

Show:

No expenses yet

"Start tracking your spending by adding your first expense."

Add a pink + Add Expense button.

Important UI Rules

Keep the application SIMPLE.

Do NOT create:

Complex financial graphs

Investment features

Bank integrations

Login/signup initially

Complicated settings

Excessive animations

Too many cards

Unnecessary pages

The main purpose is fast daily expense entry and easy date/week/month tracking.

Make the entire interface feel like a polished, simple personal finance app with a soft pink aesthetic.

Ensure:

Fully responsive design

Excellent mobile experience

Large touch-friendly buttons

Clear ₹ Indian Rupee formatting

Indian date format where appropriate

Clean spacing

Consistent pink theme

Professional typography

Fast loading

Easy navigation

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://pink-pocket-ledger.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/4ac5b967-e878-4cb5-be82-a69d8e543f76).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
