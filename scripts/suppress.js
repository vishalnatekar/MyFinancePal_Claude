const { createClient } = require('@supabase/supabase-js');
const client = createClient('https://example.com', 'key');
(async () => {
  console.log(await client.auth.signOut());
})();
