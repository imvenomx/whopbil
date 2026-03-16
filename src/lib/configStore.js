import { VercelKV } from "@vercel/kv";

const kv = new VercelKV({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const DEFAULT_CONFIG = {
  apiKey: "",
  merchantCode: "",
  price: "84,00",
};

function normalizePrice(price) {
  if (typeof price !== "string") return DEFAULT_CONFIG.price;
  const cleaned = price.replace(/[^0-9.,]/g, "").trim();
  return cleaned || DEFAULT_CONFIG.price;
}

// ==================== SUMUP ACCOUNTS ====================

export async function getSumupAccounts() {
  try {
    const raw = await kv.get("sumup-accounts");
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("[getSumupAccounts] error:", e);
    return [];
  }
}

export async function saveSumupAccounts(accounts) {
  try {
    await kv.set("sumup-accounts", JSON.stringify(accounts));
    return accounts;
  } catch (e) {
    console.error("[saveSumupAccounts] error:", e);
    throw e;
  }
}

export async function addSumupAccount(account) {
  const accounts = await getSumupAccounts();
  const newAccount = {
    id: Date.now().toString(),
    name: account.name || "Unnamed Account",
    apiKey: account.apiKey || "",
    merchantCode: account.merchantCode || "",
    createdAt: new Date().toISOString(),
  };
  accounts.push(newAccount);
  await saveSumupAccounts(accounts);
  return newAccount;
}

export async function updateSumupAccount(id, updates) {
  const accounts = await getSumupAccounts();
  const index = accounts.findIndex((a) => a.id === id);
  if (index === -1) throw new Error("Account not found");
  accounts[index] = { ...accounts[index], ...updates };
  await saveSumupAccounts(accounts);
  return accounts[index];
}

export async function deleteSumupAccount(id) {
  const accounts = await getSumupAccounts();
  const filtered = accounts.filter((a) => a.id !== id);
  await saveSumupAccounts(filtered);

  // If the deleted account was active, clear active account
  const activeId = await getActiveSumupAccountId();
  if (activeId === id) {
    await setActiveSumupAccountId(null);
  }
  return filtered;
}

// ==================== ACTIVE ACCOUNT ====================

export async function getActiveSumupAccountId() {
  try {
    const raw = await kv.get("active-sumup-account");
    console.log("[getActiveSumupAccountId] raw value:", raw, "type:", typeof raw);

    if (!raw) return null;

    // Handle if it's stored as JSON string
    if (typeof raw === "string") {
      // Check if it's a JSON string (starts with ")
      if (raw.startsWith('"') && raw.endsWith('"')) {
        try {
          return JSON.parse(raw);
        } catch {
          return raw;
        }
      }
      return raw;
    }

    // If it's already an object/value, return as string
    return String(raw);
  } catch (e) {
    console.error("[getActiveSumupAccountId] error:", e);
    return null;
  }
}

export async function setActiveSumupAccountId(id) {
  try {
    console.log("[setActiveSumupAccountId] setting id:", id);
    if (id) {
      // Store as plain string, not JSON
      await kv.set("active-sumup-account", String(id));
    } else {
      await kv.del("active-sumup-account");
    }
    console.log("[setActiveSumupAccountId] done");
    return id;
  } catch (e) {
    console.error("[setActiveSumupAccountId] error:", e);
    throw e;
  }
}

export async function getActiveSumupAccount() {
  try {
    const activeId = await getActiveSumupAccountId();
    console.log("[getActiveSumupAccount] activeId:", activeId);
    if (!activeId) return null;

    const accounts = await getSumupAccounts();
    console.log("[getActiveSumupAccount] accounts count:", accounts.length);
    console.log("[getActiveSumupAccount] account ids:", accounts.map(a => a.id));

    const found = accounts.find((a) => a.id === activeId);
    console.log("[getActiveSumupAccount] found account:", found ? found.name : "not found");
    return found || null;
  } catch (e) {
    console.error("[getActiveSumupAccount] error:", e);
    return null;
  }
}

// ==================== CHECKOUT PAGES ====================

export async function getCheckoutPages() {
  try {
    const raw = await kv.get("checkout-pages");
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("[getCheckoutPages] error:", e);
    return [];
  }
}

export async function saveCheckoutPages(pages) {
  try {
    await kv.set("checkout-pages", JSON.stringify(pages));
    return pages;
  } catch (e) {
    console.error("[saveCheckoutPages] error:", e);
    throw e;
  }
}

export async function addCheckoutPage(page) {
  const pages = await getCheckoutPages();
  const newPage = {
    id: Date.now().toString(),
    name: page.name || "Unnamed Page",
    slug: page.slug || `checkout-${Date.now()}`,
    whopPlanId: page.whopPlanId || "",
    whopEnvironment: page.whopEnvironment || "production",
    createdAt: new Date().toISOString(),
  };
  pages.push(newPage);
  await saveCheckoutPages(pages);
  return newPage;
}

export async function updateCheckoutPage(id, updates) {
  const pages = await getCheckoutPages();
  const index = pages.findIndex((p) => p.id === id);
  if (index === -1) throw new Error("Checkout page not found");
  pages[index] = { ...pages[index], ...updates };
  await saveCheckoutPages(pages);
  return pages[index];
}

export async function deleteCheckoutPage(id) {
  const pages = await getCheckoutPages();
  const filtered = pages.filter((p) => p.id !== id);
  await saveCheckoutPages(filtered);
  return filtered;
}

// ==================== LEGACY CONFIG (backwards compatibility) ====================

export async function readConfig() {
  try {
    console.log("[readConfig] starting...");

    // First try to get the active SumUp account
    const activeAccount = await getActiveSumupAccount();
    console.log("[readConfig] activeAccount:", activeAccount ? activeAccount.name : "none");

    if (activeAccount) {
      // Get stored price from legacy config or default
      const raw = await kv.get("checkout-config");
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      const price = parsed?.price || DEFAULT_CONFIG.price;

      const result = {
        apiKey: activeAccount.apiKey,
        merchantCode: activeAccount.merchantCode,
        price: normalizePrice(price),
      };
      console.log("[readConfig] returning with active account, apiKey exists:", !!result.apiKey);
      return result;
    }

    // Fallback to legacy config
    console.log("[readConfig] no active account, using legacy config");
    const raw = await kv.get("checkout-config");
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!parsed) return { ...DEFAULT_CONFIG };
    const merged = {
      ...DEFAULT_CONFIG,
      ...parsed,
    };
    return {
      apiKey: typeof merged.apiKey === "string" ? merged.apiKey.trim() : DEFAULT_CONFIG.apiKey,
      merchantCode: typeof merged.merchantCode === "string" ? merged.merchantCode.trim() : DEFAULT_CONFIG.merchantCode,
      price: normalizePrice(merged.price),
    };
  } catch (e) {
    console.error("[readConfig] error:", e);
    return { ...DEFAULT_CONFIG };
  }
}

export async function writeConfig(nextConfig) {
  const merged = {
    ...DEFAULT_CONFIG,
    ...(nextConfig || {}),
  };

  const normalized = {
    apiKey: typeof merged.apiKey === "string" ? merged.apiKey.trim() : DEFAULT_CONFIG.apiKey,
    merchantCode: typeof merged.merchantCode === "string" ? merged.merchantCode.trim() : DEFAULT_CONFIG.merchantCode,
    price: normalizePrice(merged.price),
  };

  await kv.set("checkout-config", JSON.stringify(normalized));
  return normalized;
}

// ==================== CUSTOMERS ====================

export async function getCustomers() {
  try {
    const raw = await kv.get("sumup-customers");
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("[getCustomers] error:", e);
    return [];
  }
}

export async function saveCustomers(customers) {
  try {
    await kv.set("sumup-customers", JSON.stringify(customers));
    return customers;
  } catch (e) {
    console.error("[saveCustomers] error:", e);
    throw e;
  }
}

export async function addCustomer(customer) {
  const customers = await getCustomers();
  const newCustomer = {
    id: Date.now().toString(),
    sumupCustomerId: customer.sumupCustomerId || "",
    email: customer.email || "",
    name: customer.name || "",
    createdAt: new Date().toISOString(),
    paymentInstruments: customer.paymentInstruments || [],
  };
  customers.push(newCustomer);
  await saveCustomers(customers);
  return newCustomer;
}

export async function updateCustomer(id, updates) {
  const customers = await getCustomers();
  const index = customers.findIndex((c) => c.id === id);
  if (index === -1) throw new Error("Customer not found");
  customers[index] = { ...customers[index], ...updates };
  await saveCustomers(customers);
  return customers[index];
}

export async function deleteCustomer(id) {
  const customers = await getCustomers();
  const filtered = customers.filter((c) => c.id !== id);
  await saveCustomers(filtered);
  return filtered;
}

export async function getCustomerByEmail(email) {
  const customers = await getCustomers();
  return customers.find((c) => c.email.toLowerCase() === email.toLowerCase()) || null;
}

export async function getCustomerBySumupId(sumupCustomerId) {
  const customers = await getCustomers();
  return customers.find((c) => c.sumupCustomerId === sumupCustomerId) || null;
}

export async function getCustomerById(id) {
  const customers = await getCustomers();
  return customers.find((c) => c.id === id) || null;
}

// ==================== SUBSCRIPTIONS ====================

export async function getSubscriptions() {
  try {
    const raw = await kv.get("sumup-subscriptions");
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error("[getSubscriptions] error:", e);
    return [];
  }
}

export async function saveSubscriptions(subscriptions) {
  try {
    await kv.set("sumup-subscriptions", JSON.stringify(subscriptions));
    return subscriptions;
  } catch (e) {
    console.error("[saveSubscriptions] error:", e);
    throw e;
  }
}

export async function addSubscription(subscription) {
  const subscriptions = await getSubscriptions();
  const newSubscription = {
    id: Date.now().toString(),
    customerId: subscription.customerId,
    checkoutPageId: subscription.checkoutPageId || null,
    amount: subscription.amount,
    currency: subscription.currency || "EUR",
    interval: subscription.interval || "monthly",
    intervalCount: subscription.intervalCount || 1,
    status: "active",
    nextChargeDate: subscription.nextChargeDate || calculateNextChargeDate(subscription.interval, subscription.intervalCount),
    lastChargeDate: null,
    failedAttempts: 0,
    createdAt: new Date().toISOString(),
    metadata: subscription.metadata || {},
  };
  subscriptions.push(newSubscription);
  await saveSubscriptions(subscriptions);
  return newSubscription;
}

export async function updateSubscription(id, updates) {
  const subscriptions = await getSubscriptions();
  const index = subscriptions.findIndex((s) => s.id === id);
  if (index === -1) throw new Error("Subscription not found");
  subscriptions[index] = { ...subscriptions[index], ...updates };
  await saveSubscriptions(subscriptions);
  return subscriptions[index];
}

export async function deleteSubscription(id) {
  const subscriptions = await getSubscriptions();
  const filtered = subscriptions.filter((s) => s.id !== id);
  await saveSubscriptions(filtered);
  return filtered;
}

export async function getSubscriptionsByCustomerId(customerId) {
  const subscriptions = await getSubscriptions();
  return subscriptions.filter((s) => s.customerId === customerId);
}

export async function getDueSubscriptions() {
  const subscriptions = await getSubscriptions();
  const now = new Date();
  return subscriptions.filter((s) => {
    if (s.status !== "active") return false;
    const nextCharge = new Date(s.nextChargeDate);
    return nextCharge <= now;
  });
}

export async function getSubscriptionById(id) {
  const subscriptions = await getSubscriptions();
  return subscriptions.find((s) => s.id === id) || null;
}

// Helper function to calculate next charge date based on interval
export function calculateNextChargeDate(interval, intervalCount = 1) {
  const now = new Date();
  const next = new Date(now);

  switch (interval) {
    case "daily":
      next.setDate(next.getDate() + intervalCount);
      break;
    case "weekly":
      next.setDate(next.getDate() + (7 * intervalCount));
      break;
    case "monthly":
      next.setMonth(next.getMonth() + intervalCount);
      break;
    case "yearly":
      next.setFullYear(next.getFullYear() + intervalCount);
      break;
    default:
      next.setMonth(next.getMonth() + 1); // Default to monthly
  }

  return next.toISOString();
}

// ==================== BILLING LOGS ====================

export async function getBillingLogs(limit = 100) {
  try {
    const raw = await kv.get("sumup-billing-logs");
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    const logs = Array.isArray(parsed) ? parsed : [];
    // Return most recent first, limited
    return logs.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, limit);
  } catch (e) {
    console.error("[getBillingLogs] error:", e);
    return [];
  }
}

export async function saveBillingLogs(logs) {
  try {
    await kv.set("sumup-billing-logs", JSON.stringify(logs));
    return logs;
  } catch (e) {
    console.error("[saveBillingLogs] error:", e);
    throw e;
  }
}

export async function addBillingLog(log) {
  const logs = await getBillingLogs(1000); // Get more for storage
  const newLog = {
    id: Date.now().toString(),
    subscriptionId: log.subscriptionId,
    customerId: log.customerId,
    amount: log.amount,
    currency: log.currency || "EUR",
    status: log.status, // "success", "failed", "pending"
    errorMessage: log.errorMessage || null,
    sumupCheckoutId: log.sumupCheckoutId || null,
    transactionCode: log.transactionCode || null,
    createdAt: new Date().toISOString(),
  };
  logs.unshift(newLog); // Add to beginning (most recent first)
  // Keep only last 1000 logs
  const trimmed = logs.slice(0, 1000);
  await saveBillingLogs(trimmed);
  return newLog;
}

export async function getBillingLogsBySubscription(subscriptionId, limit = 50) {
  const logs = await getBillingLogs(1000);
  return logs.filter((l) => l.subscriptionId === subscriptionId).slice(0, limit);
}
