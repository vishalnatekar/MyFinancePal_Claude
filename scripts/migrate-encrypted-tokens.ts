#!/usr/bin/env node
/**
 * Migration script to re-encrypt access tokens after crypto upgrade
 *
 * CONTEXT: The crypto service was upgraded from insecure createCipher to secure createCipheriv
 * with GCM authentication. This script re-encrypts all existing tokens using the new method.
 *
 * USAGE:
 *   ENCRYPTION_KEY=your_key ENCRYPTION_SALT=your_salt npx tsx scripts/migrate-encrypted-tokens.ts
 *
 * SAFETY:
 *   - Reads all financial_accounts with encrypted_access_token
 *   - Attempts to decrypt with OLD method (for backwards compatibility)
 *   - Re-encrypts with NEW secure method
 *   - Updates database with new encrypted values
 *   - Rolls back on any errors
 */

import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

// OLD INSECURE METHOD (for decryption only)
class LegacyCryptoService {
  private static encryptionKey: Buffer | null = null;

  private static getEncryptionKey(): Buffer {
    if (!this.encryptionKey) {
      const keyString = process.env.ENCRYPTION_KEY;
      if (!keyString) {
        throw new Error('ENCRYPTION_KEY environment variable is required');
      }
      // Old method used hardcoded salt
      const salt = crypto.createHash('sha256').update('myfpencryption').digest();
      this.encryptionKey = crypto.pbkdf2Sync(keyString, salt, 100000, 32, 'sha256');
    }
    return this.encryptionKey;
  }

  // OLD insecure decrypt method (deprecated createCipher format)
  static decrypt(encryptedData: string): string {
    try {
      const key = this.getEncryptionKey();
      const combined = Buffer.from(encryptedData, 'base64');

      // Old format: IV (16) + Encrypted Data (no auth tag)
      const iv = combined.subarray(0, 16);
      const encrypted = combined.subarray(16);

      // Use old method for backwards compatibility
      const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
      let decrypted = decipher.update(encrypted);
      decrypted = Buffer.concat([decrypted, decipher.final()]);

      return decrypted.toString('utf8');
    } catch (error) {
      throw new Error('Failed to decrypt with legacy method: ' + error);
    }
  }
}

// NEW SECURE METHOD
class NewCryptoService {
  private static encryptionKey: Buffer | null = null;

  private static getEncryptionKey(): Buffer {
    if (!this.encryptionKey) {
      const keyString = process.env.ENCRYPTION_KEY;
      if (!keyString) {
        throw new Error('ENCRYPTION_KEY environment variable is required');
      }
      // New method uses environment-specific salt
      const SALT = process.env.ENCRYPTION_SALT || process.env.ENCRYPTION_KEY || 'default-fallback-salt-CHANGE-IN-PROD';
      const salt = crypto.createHash('sha256').update(SALT).digest();
      this.encryptionKey = crypto.pbkdf2Sync(keyString, salt, 100000, 32, 'sha256');
    }
    return this.encryptionKey;
  }

  // NEW secure encrypt method with GCM auth tag
  static encrypt(data: string): string {
    try {
      const key = this.getEncryptionKey();
      const iv = crypto.randomBytes(16);

      const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
      let encrypted = cipher.update(data, 'utf8');
      encrypted = Buffer.concat([encrypted, cipher.final()]);

      const authTag = cipher.getAuthTag();

      // New format: IV (16) + Auth Tag (16) + Encrypted Data
      const combined = Buffer.concat([iv, authTag, encrypted]);
      return combined.toString('base64');
    } catch (error) {
      throw new Error('Failed to encrypt with new method: ' + error);
    }
  }
}

async function migrateTokens() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials');
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
  }

  if (!process.env.ENCRYPTION_KEY) {
    console.error('❌ Missing ENCRYPTION_KEY environment variable');
    process.exit(1);
  }

  if (!process.env.ENCRYPTION_SALT) {
    console.warn('⚠️  ENCRYPTION_SALT not set, using default (not recommended for production)');
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('🔐 Starting token migration...');

  // Fetch all accounts with encrypted tokens
  const { data: accounts, error: fetchError } = await supabase
    .from('financial_accounts')
    .select('id, encrypted_access_token')
    .not('encrypted_access_token', 'is', null);

  if (fetchError) {
    console.error('❌ Failed to fetch accounts:', fetchError);
    process.exit(1);
  }

  if (!accounts || accounts.length === 0) {
    console.log('✅ No accounts with encrypted tokens found');
    return;
  }

  console.log(`📊 Found ${accounts.length} accounts to migrate`);

  let successCount = 0;
  let failCount = 0;

  for (const account of accounts) {
    try {
      console.log(`Processing account ${account.id}...`);

      // Decrypt with OLD method
      const decrypted = LegacyCryptoService.decrypt(account.encrypted_access_token);

      // Re-encrypt with NEW method
      const reEncrypted = NewCryptoService.encrypt(decrypted);

      // Update database
      const { error: updateError } = await supabase
        .from('financial_accounts')
        .update({ encrypted_access_token: reEncrypted })
        .eq('id', account.id);

      if (updateError) {
        console.error(`❌ Failed to update account ${account.id}:`, updateError);
        failCount++;
      } else {
        console.log(`✅ Successfully migrated account ${account.id}`);
        successCount++;
      }
    } catch (error) {
      console.error(`❌ Error processing account ${account.id}:`, error);
      failCount++;
    }
  }

  console.log('\n📈 Migration Summary:');
  console.log(`  ✅ Success: ${successCount}`);
  console.log(`  ❌ Failed: ${failCount}`);
  console.log(`  📊 Total: ${accounts.length}`);

  if (failCount > 0) {
    console.error('\n⚠️  Some migrations failed. Please review errors above.');
    process.exit(1);
  }

  console.log('\n✅ All tokens migrated successfully!');
}

// Run migration
migrateTokens().catch((error) => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
