// small shim for contact form submission
// later replace submitContact with a real fetch('/api/contact', { method: 'POST', body: formData })
export async function submitContact(payload) {
    // payload is plain object { name, email, phone, subject, message, reason, subscribe }
    // simulate network latency — returns { success: true, message: '...' }
    return new Promise((resolve) => {
        setTimeout(() => {
            // simulate success always for frontend dev
            resolve({ success: true, message: "Message received. We'll get back to you shortly." });
        }, 800);
    });
}
