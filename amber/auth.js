// Browser-only OAuth client. Server-side authorization lives in Supabase RLS.
// The public Supabase publishable key is safe to expose only WITH RLS.
const cfg = window.AMBER_AUTH_CONFIG || {};
const bridge = window.AmberAuth = window.AmberAuth || {};
bridge.state = "unconfigured";
bridge.user = null;
bridge.client = null;
const update = (user) => {
  bridge.user = user || null;
  window.dispatchEvent(new CustomEvent("amber:auth-change", {detail:{signedIn:!!user}}));
};
bridge.signIn = async () => {
  if(!bridge.client) throw new Error("Google-Anmeldung muss zunächst mit Supabase verbunden werden.");
  const {error} = await bridge.client.auth.signInWithOAuth({
    provider: "google",
    options: {redirectTo:location.origin + location.pathname, scopes:"openid email profile"}
  });
  if(error) throw error;
};
bridge.signOut = async () => {
  if(!bridge.client) return;
  const {error} = await bridge.client.auth.signOut();
  if(error) throw error;
  update(null);
};
if (cfg.url && cfg.publishableKey && /^https:\/\/[a-z0-9.-]+\.supabase\.co$/.test(cfg.url)) {
  try {
    const {createClient} = await import("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.102.0/+esm");
    bridge.client = createClient(cfg.url, cfg.publishableKey, {
      auth: {persistSession: true, autoRefreshToken:true, detectSessionInUrl:true, flowType:"pkce"}
    });
    bridge.state = "ready";
    const {data, error} = await bridge.client.auth.getUser();
    if(error && error.name !== "AuthSessionMissingError") console.warn("Amber Auth:", error.message);
    update(data?.user || null);
    bridge.client.auth.onAuthStateChange((event,session)=>{
      // Postpone DB requests until the auth state transition completes.
      setTimeout(()=>update(session?.user || null),0);
    });
  } catch(err) {
    bridge.state="error";
    bridge.error=err.message;
    window.dispatchEvent(new Event("amber:auth-change"));
  }
} else {
  window.dispatchEvent(new Event("amber:auth-change"));
}
