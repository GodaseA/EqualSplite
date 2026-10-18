import axios from "axios";

const BASE_URL = "http://localhost:5000/api";

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// =====================================================
// TEST DATA
// =====================================================

const users = [
  {
    name: "Test Abhi",
    email: `abhi_${Date.now()}@test.com`,
    password: "12345678",
  },
  {
    name: "Test Rahul",
    email: `rahul_${Date.now()}@test.com`,
    password: "12345678",
  },
  {
    name: "Test Akash",
    email: `akash_${Date.now()}@test.com`,
    password: "12345678",
  },
  {
    name: "Test Pratik",
    email: `pratik_${Date.now()}@test.com`,
    password: "12345678",
  },
];

let abhi;
let rahul;
let akash;
let pratik;

let abhiToken;

let groupId;

let equalExpenseId;
let exactExpenseId;
let percentageExpenseId;

let settlementId;

// =====================================================
// HELPER
// =====================================================

const print = (title, data) => {
  console.log("\n========================================");
  console.log(title);
  console.log("========================================");

  console.log(JSON.stringify(data, null, 2));
};

const request = async (method, url, data = null, token = null) => {
  try {
    const config = {};

    if (token) {
      config.headers = {
        Authorization: `Bearer ${token}`,
      };
    }

    const response = await api.request({
      method,
      url,
      data,
      ...config,
    });

    return response.data;
  } catch (error) {
    console.log("\n❌ REQUEST FAILED");

    if (error.response) {
      console.log("Status:", error.response.status);
      console.log(
        JSON.stringify(error.response.data, null, 2)
      );
    } else {
      console.log(error.message);
    }

    return null;
  }
};

// =====================================================
// 1. REGISTER USERS
// =====================================================

const registerUsers = async () => {
  console.log("\n\n🚀 REGISTERING USERS...");

  const results = [];

  for (const user of users) {
    const result = await request(
      "POST",
      "/auth/register",
      user
    );

    if (result?.success) {
      results.push(result.user);

      console.log(
        `✅ Registered: ${result.user.name}`
      );
    }
  }

  if (results.length < 4) {
    throw new Error("Not all users were registered");
  }

  abhi = results[0];
  rahul = results[1];
  akash = results[2];
  pratik = results[3];

  print("REGISTERED USERS", results);
};

// =====================================================
// 2. LOGIN ABHI
// =====================================================

const loginAbhi = async () => {
  console.log("\n\n🔐 LOGIN ABHI...");

  const result = await request(
    "POST",
    "/auth/login",
    {
      email: users[0].email,
      password: users[0].password,
    }
  );

  if (!result?.success) {
    throw new Error("Login failed");
  }

  abhiToken = result.token;

  print("LOGIN RESPONSE", {
    user: result.user,
    token: result.token,
  });
};

// =====================================================
// 3. GET CURRENT USER
// =====================================================

const getMe = async () => {
  console.log("\n\n👤 GET CURRENT USER...");

  const result = await request(
    "GET",
    "/auth/me",
    null,
    abhiToken
  );

  print("CURRENT USER", result);
};

// =====================================================
// 4. CREATE GROUP
// =====================================================

const createGroup = async () => {
  console.log("\n\n👥 CREATE GROUP...");

  const result = await request(
    "POST",
    "/groups",
    {
      name: "Test Goa Trip",

      members: [
        rahul.id,
        akash.id,
        pratik.id,
      ],
    },
    abhiToken
  );

  if (!result?.success) {
    throw new Error("Group creation failed");
  }

  groupId = result.group._id;

  print("CREATED GROUP", result.group);
};

// =====================================================
// 5. GET MY GROUPS
// =====================================================

const getMyGroups = async () => {
  console.log("\n\n📋 GET MY GROUPS...");

  const result = await request(
    "GET",
    "/groups",
    null,
    abhiToken
  );

  print("MY GROUPS", result);
};

// =====================================================
// 6. GET SINGLE GROUP
// =====================================================

const getSingleGroup = async () => {
  console.log("\n\n🔎 GET SINGLE GROUP...");

  const result = await request(
    "GET",
    `/groups/${groupId}`,
    null,
    abhiToken
  );

  print("GROUP DETAILS", result);
};

// =====================================================
// 7. ADD MEMBER
// =====================================================

const addMember = async () => {
  console.log("\n\n➕ TEST ADD MEMBER...");

  const result = await request(
    "POST",
    `/groups/${groupId}/members`,
    {
      userId: abhi.id,
    },
    abhiToken
  );

  /*
    This should fail because Abhi
    is already a member.
  */

  print("ADD EXISTING MEMBER RESPONSE", result);
};

// =====================================================
// 8. CREATE EQUAL EXPENSE
// =====================================================

const createEqualExpense = async () => {
  console.log("\n\n💰 CREATE EQUAL EXPENSE...");

  const result = await request(
    "POST",
    "/expenses",
    {
      groupId,

      description: "Dinner",

      amount: 2000,

      splitType: "equal",

      paidBy: [
        {
          user: abhi.id,
          amount: 2000,
        },
      ],

      splits: [
        {
          user: abhi.id,
        },
        {
          user: rahul.id,
        },
        {
          user: akash.id,
        },
        {
          user: pratik.id,
        },
      ],

      category: "food",

      notes: "Test equal split",
    },
    abhiToken
  );

  if (!result?.success) {
    throw new Error("Equal expense creation failed");
  }

  equalExpenseId = result.expense._id;

  print("EQUAL EXPENSE", result.expense);
};

// =====================================================
// 9. CREATE EXACT EXPENSE
// =====================================================

const createExactExpense = async () => {
  console.log("\n\n💰 CREATE EXACT EXPENSE...");

  const result = await request(
    "POST",
    "/expenses",
    {
      groupId,

      description: "Shopping",

      amount: 2000,

      splitType: "exact",

      paidBy: [
        {
          user: rahul.id,
          amount: 2000,
        },
      ],

      splits: [
        {
          user: abhi.id,
          amount: 800,
        },
        {
          user: rahul.id,
          amount: 500,
        },
        {
          user: akash.id,
          amount: 400,
        },
        {
          user: pratik.id,
          amount: 300,
        },
      ],

      category: "shopping",

      notes: "Test exact split",
    },
    abhiToken
  );

  if (!result?.success) {
    throw new Error("Exact expense creation failed");
  }

  exactExpenseId = result.expense._id;

  print("EXACT EXPENSE", result.expense);
};

// =====================================================
// 10. CREATE PERCENTAGE EXPENSE
// =====================================================

const createPercentageExpense = async () => {
  console.log("\n\n💰 CREATE PERCENTAGE EXPENSE...");

  const result = await request(
    "POST",
    "/expenses",
    {
      groupId,

      description: "Hotel",

      amount: 5000,

      splitType: "percentage",

      paidBy: [
        {
          user: akash.id,
          amount: 5000,
        },
      ],

      splits: [
        {
          user: abhi.id,
          percentage: 40,
        },
        {
          user: rahul.id,
          percentage: 30,
        },
        {
          user: akash.id,
          percentage: 20,
        },
        {
          user: pratik.id,
          percentage: 10,
        },
      ],

      category: "hotel",

      notes: "Test percentage split",
    },
    abhiToken
  );

  if (!result?.success) {
    throw new Error(
      "Percentage expense creation failed"
    );
  }

  percentageExpenseId = result.expense._id;

  print(
    "PERCENTAGE EXPENSE",
    result.expense
  );
};

// =====================================================
// 11. GET GROUP EXPENSES
// =====================================================

const getGroupExpenses = async () => {
  console.log("\n\n📋 GET GROUP EXPENSES...");

  const result = await request(
    "GET",
    `/expenses/group/${groupId}`,
    null,
    abhiToken
  );

  print("GROUP EXPENSES", result);
};

// =====================================================
// 12. GET SINGLE EXPENSE
// =====================================================

const getSingleExpense = async () => {
  console.log("\n\n🔎 GET SINGLE EXPENSE...");

  const result = await request(
    "GET",
    `/expenses/${equalExpenseId}`,
    null,
    abhiToken
  );

  print("SINGLE EXPENSE", result);
};

// =====================================================
// 13. GET BALANCES
// =====================================================

const getBalances = async () => {
  console.log("\n\n⚖️ CALCULATING BALANCES...");

  const result = await request(
    "GET",
    `/balances/group/${groupId}`,
    null,
    abhiToken
  );

  print("GROUP BALANCES", result);
};

// =====================================================
// 14. CREATE SETTLEMENT
// =====================================================

const createSettlement = async () => {
  console.log("\n\n🤝 CREATE SETTLEMENT...");

  /*
    Rahul pays Abhi ₹500

    We are using Abhi's token here only because
    the current API doesn't allow us to login Rahul.
    Therefore req.user would be Abhi.

    To properly test:
    Rahul should login and use Rahul's token.

    We will login Rahul below.
  */

  const loginResult = await request(
    "POST",
    "/auth/login",
    {
      email: users[1].email,
      password: users[1].password,
    }
  );

  if (!loginResult?.success) {
    throw new Error("Rahul login failed");
  }

  const rahulToken = loginResult.token;

  const result = await request(
    "POST",
    "/settlements",
    {
      groupId,

      paidTo: abhi.id,

      amount: 500,

      note: "Dinner settlement",
    },
    rahulToken
  );

  if (!result?.success) {
    throw new Error(
      "Settlement creation failed"
    );
  }

  settlementId = result.settlement._id;

  print("SETTLEMENT", result);
};

// =====================================================
// 15. GET SETTLEMENTS
// =====================================================

const getSettlements = async () => {
  console.log("\n\n📋 GET SETTLEMENTS...");

  const result = await request(
    "GET",
    `/settlements/group/${groupId}`,
    null,
    abhiToken
  );

  print("SETTLEMENT HISTORY", result);
};

// =====================================================
// 16. GET SINGLE SETTLEMENT
// =====================================================

const getSingleSettlement = async () => {
  console.log("\n\n🔎 GET SINGLE SETTLEMENT...");

  const result = await request(
    "GET",
    `/settlements/${settlementId}`,
    null,
    abhiToken
  );

  print("SINGLE SETTLEMENT", result);
};

// =====================================================
// 17. CHECK BALANCE AFTER SETTLEMENT
// =====================================================

const getBalancesAfterSettlement = async () => {
  console.log(
    "\n\n⚖️ BALANCES AFTER SETTLEMENT..."
  );

  const result = await request(
    "GET",
    `/balances/group/${groupId}`,
    null,
    abhiToken
  );

  print(
    "BALANCES AFTER SETTLEMENT",
    result
  );
};

// =====================================================
// 18. DELETE SETTLEMENT
// =====================================================

const deleteSettlement = async () => {
  console.log("\n\n🗑️ DELETE SETTLEMENT...");

  const result = await request(
    "DELETE",
    `/settlements/${settlementId}`,
    null,
    abhiToken
  );

  print("DELETE SETTLEMENT", result);
};

// =====================================================
// 19. DELETE EXPENSE
// =====================================================

const deleteExpense = async () => {
  console.log("\n\n🗑️ DELETE EXPENSE...");

  const result = await request(
    "DELETE",
    `/expenses/${percentageExpenseId}`,
    null,
    abhiToken
  );

  print("DELETE EXPENSE", result);
};

// =====================================================
// RUN EVERYTHING
// =====================================================

const runTests = async () => {
  try {
    console.log("\n");
    console.log("========================================");
    console.log("🚀 EXPENSE SPLITTER API TEST");
    console.log("========================================");

    await registerUsers();

    await loginAbhi();

    await getMe();

    await createGroup();

    await getMyGroups();

    await getSingleGroup();

    await addMember();

    await createEqualExpense();

    await createExactExpense();

    await createPercentageExpense();

    await getGroupExpenses();

    await getSingleExpense();

    await getBalances();

    await createSettlement();

    await getSettlements();

    await getSingleSettlement();

    await getBalancesAfterSettlement();

    await deleteSettlement();

    await deleteExpense();

    console.log("\n");
    console.log("========================================");
    console.log("🎉 ALL TESTS COMPLETED");
    console.log("========================================");
    console.log("\n");
  } catch (error) {
    console.error("\n");
    console.error("========================================");
    console.error("❌ TEST FAILED");
    console.error("========================================");

    console.error(error.message);
  }
};

runTests();