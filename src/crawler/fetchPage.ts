import axios from "axios";
import { logger } from "../logger";

export async function fetchPage(url: string): Promise<string | null> {
  try {
    const response = await axios.get(url, {
      timeout: 8000, // 8 seconds is enough
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ZembroBot/1.0; +https://zembro.co.uk)",
      },
      validateStatus: () => true,
    });

    if (response.status >= 200 && response.status < 300) {
      return response.data;
    }

    logger.warn(`fetchPage: ${url} returned status ${response.status}`);
    return null;
  } catch (err) {
    logger.error("fetchPage error for url:", url, err);
    return null;
  }
}
