/**
 * Utility to send form data to Formspree
 */
export async function sendToFormspree(data: Record<string, any>) {
  const FORMSPREE_URL = "https://formspree.io/f/meevqoao";
  
  try {
    const response = await fetch(FORMSPREE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      body: JSON.stringify(data)
    });
    
    if (!response.ok) {
      console.error("Formspree submission failed:", response.statusText);
    }
  } catch (error) {
    console.error("Error sending to Formspree:", error);
  }
}
