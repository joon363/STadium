async function check() {
  const res = await fetch('https://rfqaufojzfgviggogyop.supabase.co/rest/v1/', {
    headers: { apikey: 'sb_publishable_SwJX0hN6fDWEczFeFBrTZA_tLf7XSS-' }
  });
  console.log('Rest status:', res.status);
}
check();
