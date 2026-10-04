const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GMAIL_BASE = "https://gmail.googleapis.com/gmail/v1/users/me";
const CAL_BASE = "https://www.googleapis.com/calendar/v3";

function configured() {
  return Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.GOOGLE_REFRESH_TOKEN);
}

async function accessToken() {
  if (!configured()) {
    const err = new Error("Google live-data bridge is not authenticated.");
    err.code = "GOOGLE_AUTH_REQUIRED";
    throw err;
  }
  const body = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    client_secret: process.env.GOOGLE_CLIENT_SECRET,
    refresh_token: process.env.GOOGLE_REFRESH_TOKEN,
    grant_type: "refresh_token",
  });
  const res = await fetch(GOOGLE_TOKEN_URL, { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body });
  if (!res.ok) throw new Error("Google token refresh failed: " + res.status);
  return (await res.json()).access_token;
}

async function googleJson(url) {
  const token = await accessToken();
  const res = await fetch(url, { headers: { authorization: "Bearer " + token } });
  if (!res.ok) throw new Error("Google API request failed: " + res.status + " " + url);
  return res.json();
}

function londonDayRange(daysAhead = 8) {
  const now = new Date();
  const end = new Date(now.getTime() + daysAhead * 86400000);
  return { timeMin: now.toISOString(), timeMax: end.toISOString() };
}

async function calendarEvents() {
  const { timeMin, timeMax } = londonDayRange();
  const q = new URLSearchParams({
    timeMin, timeMax, singleEvents: "true", orderBy: "startTime", maxResults: "12", timeZone: "Europe/London"
  });
  const data = await googleJson(CAL_BASE + "/calendars/primary/events?" + q);
  return (data.items || []).filter(x => x.status !== "cancelled").map(x => ({
    title: x.summary || "(untitled)",
    start: x.start?.dateTime || x.start?.date || null,
    end: x.end?.dateTime || x.end?.date || null,
    location: x.location || null
  }));
}

async function importantEmails() {
  const q = encodeURIComponent("newer_than:2d -in:spam -in:trash -category:promotions");
  const list = await googleJson(GMAIL_BASE + "/messages?q=" + q + "&maxResults=12");
  const ids = (list.messages || []).map(x => x.id);
  const rows = [];
  for (const id of ids.slice(0, 12)) {
    const msg = await googleJson(GMAIL_BASE + "/messages/" + id + "?format=metadata&metadataHeaders=From&metadataHeaders=Subject&metadataHeaders=Date");
    const headers = Object.fromEntries((msg.payload?.headers || []).map(h => [h.name.toLowerCase(), h.value]));
    rows.push({ id, from: headers.from || "", subject: headers.subject || "", date: headers.date || "", snippet: msg.snippet || "", labels: msg.labelIds || [] });
  }
  return rows;
}

async function morningLiveData() {
  if (!configured()) return { connected: false, reason: "GOOGLE_AUTH_REQUIRED" };
  const [calendar, email] = await Promise.allSettled([calendarEvents(), importantEmails()]);
  return {
    connected: true,
    calendar: calendar.status === "fulfilled" ? calendar.value : [],
    email: email.status === "fulfilled" ? email.value : [],
    errors: [
      ...(calendar.status === "rejected" ? ["calendar: " + calendar.reason.message] : []),
      ...(email.status === "rejected" ? ["gmail: " + email.reason.message] : [])
    ]
  };
}

module.exports = { configured, morningLiveData };
