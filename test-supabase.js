import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://axozefedjmitcbioidtj.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4b3plZmVkam1pdGNiaW9pZHRqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQzMzMyODEsImV4cCI6MjA0OTkwOTI4MX0.kgC8h0I2x_-DZ78Uz2sQgxdhbinBw5kv7kOST5vjGR8';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testConnection() {
    console.log('Testing Supabase connection...');
    console.log('URL:', SUPABASE_URL);
    console.log('Key (first 50 chars):', SUPABASE_KEY.substring(0, 50) + '...');

    // Test 1: Count candidates
    const { data: countData, error: countError, count } = await supabase
        .from('candidates')
        .select('id', { count: 'exact', head: true });

    if (countError) {
        console.error('\n❌ Count query failed:', countError);
    } else {
        console.log('\n✅ Total candidates:', count);
    }

    // Test 2: Get first 5 candidates
    const { data, error } = await supabase
        .from('candidates')
        .select('id, full_name, email, status, ai_score')
        .limit(5);

    if (error) {
        console.error('\n❌ Select query failed:', error);
    } else {
        console.log('\n✅ First 5 candidates:');
        console.log(JSON.stringify(data, null, 2));
    }

    // Test 3: Try to get one specific candidate
    const { data: one, error: oneError } = await supabase
        .from('candidates')
        .select('*')
        .eq('id', 19)
        .single();

    if (oneError) {
        console.error('\n❌ Single candidate query failed:', oneError);
    } else {
        console.log('\n✅ Candidate ID 19:', one ? 'Found' : 'Not found');
        if (one) console.log(JSON.stringify(one, null, 2));
    }
}

testConnection().catch(console.error);
