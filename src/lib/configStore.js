import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const CONFIG_PATH = path.join(process.cwd(), "checkout-config.json");

const DEFAULT_CONFIG = {
  iframeUrl: "https://pay.sumup.com/b2c/QOWZ174A",
  price: "84,00",
};

function normalizePrice(price) {
  if (typeof price !== "string") return DEFAULT_CONFIG.price;
  const cleaned = price.replace(/[^0-9.,]/g, "").trim();
  return cleaned || DEFAULT_CONFIG.price;
}

export async function readConfig() {
  try {
    const raw = await readFile(CONFIG_PATH, "utf8");
    const parsed = JSON.parse(raw);

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

  await writeFile(CONFIG_PATH, JSON.stringify(normalized, null, 2) + "\n", "utf8");
  return normalized;
}
