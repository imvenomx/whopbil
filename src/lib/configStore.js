import { VercelKV } from "@vercel/kv";

const kv = new VercelKV({
  url: process.env.KV_REST_API_URL,
  token: process.env.KV_REST_API_TOKEN,
});

const DEFAULT_CONFIG = {
  iframeUrl: "https://pay.sumup.com/b2c/QOWZ174A",
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
    iframeUrl: account.iframeUrl || "",
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
    return raw || null;
  } catch (e) {
    console.error("[getActiveSumupAccountId] error:", e);
    return null;
  }
}

export async function setActiveSumupAccountId(id) {
  try {
    if (id) {
      await kv.set("active-sumup-account", id);
    } else {
      await kv.del("active-sumup-account");
    }
    return id;
  } catch (e) {
    console.error("[setActiveSumupAccountId] error:", e);
    throw e;
  }
}

export async function getActiveSumupAccount() {
  try {
    const activeId = await getActiveSumupAccountId();
    if (!activeId) return null;
    const accounts = await getSumupAccounts();
    return accounts.find((a) => a.id === activeId) || null;
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
    price: normalizePrice(page.price),
    productName: page.productName || "Product",
    productImage: page.productImage || "",
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
  if (updates.price) {
    updates.price = normalizePrice(updates.price);
  }
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
    // First try to get the active SumUp account
    const activeAccount = await getActiveSumupAccount();
    if (activeAccount) {
      // Get stored price from legacy config or default
      const raw = await kv.get("checkout-config");
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      const price = parsed?.price || DEFAULT_CONFIG.price;

      return {
        iframeUrl: activeAccount.iframeUrl,
        price: normalizePrice(price),
      };
    }

    // Fallback to legacy config
    const raw = await kv.get("checkout-config");
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!parsed) return { ...DEFAULT_CONFIG };
    const merged = {
      ...DEFAULT_CONFIG,
      ...parsed,
    };
    return {
      iframeUrl:
        typeof merged.iframeUrl === "string" ? merged.iframeUrl.trim() : DEFAULT_CONFIG.iframeUrl,
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
    iframeUrl:
      typeof merged.iframeUrl === "string" ? merged.iframeUrl.trim() : DEFAULT_CONFIG.iframeUrl,
    price: normalizePrice(merged.price),
  };

  await kv.set("checkout-config", JSON.stringify(normalized));
  return normalized;
}
