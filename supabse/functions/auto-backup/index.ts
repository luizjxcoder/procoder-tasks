import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.56.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface BackupRequest {
  backupType: 'scheduled' | 'triggered' | 'manual';
  userId?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { backupType = 'manual', userId }: BackupRequest = await req.json().catch(() => ({}));

    console.log('Starting backup process:', { backupType, userId });

    // Create backup log entry
    const { data: logEntry, error: logError } = await supabase
      .from('backup_logs')
      .insert({
        backup_type: backupType,
        status: 'in_progress',
        user_id: userId
      })
      .select()
      .single();

    if (logError) {
      console.error('Error creating backup log:', logError);
      throw new Error('Failed to create backup log');
    }

    try {
      // Collect all system data
      const backupData = {
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        backup_type: backupType,
        data: {}
      };

      // Get backup settings
      const { data: backupSettings } = await supabase
        .from('backup_settings')
        .select('*');

      if (backupSettings) {
        backupData.data.backup_settings = backupSettings;
      }

      // Get backup logs (last 100 entries)
      const { data: backupLogs } = await supabase
        .from('backup_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (backupLogs) {
        backupData.data.backup_logs = backupLogs;
      }

      // Add any additional tables that exist in your system
      // For now, we'll backup the configuration data stored in localStorage
      // This would be expanded to include actual application data tables

      const fileName = `backup-${backupType}-${new Date().toISOString().split('T')[0]}-${Date.now()}.json`;
      const backupContent = JSON.stringify(backupData, null, 2);
      const backupBlob = new Blob([backupContent], { type: 'application/json' });

      // Upload backup to storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('backups')
        .upload(fileName, backupBlob, {
          contentType: 'application/json',
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading backup:', uploadError);
        throw new Error('Failed to upload backup file');
      }

      console.log('Backup uploaded successfully:', uploadData);

      // Update backup log with success
      await supabase
        .from('backup_logs')
        .update({
          status: 'success',
          file_path: fileName,
          file_size: backupContent.length
        })
        .eq('id', logEntry.id);

      // Update last backup time for user
      if (userId) {
        await supabase
          .from('backup_settings')
          .upsert({
            user_id: userId,
            last_backup_at: new Date().toISOString(),
            auto_backup_enabled: true,
            backup_on_changes: true
          });
      }

      return new Response(JSON.stringify({
        success: true,
        message: 'Backup created successfully',
        fileName,
        size: backupContent.length,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });

    } catch (backupError) {
      console.error('Backup process failed:', backupError);
      
      // Update backup log with error
      await supabase
        .from('backup_logs')
        .update({
          status: 'failed',
          error_message: backupError.message
        })
        .eq('id', logEntry.id);

      throw backupError;
    }

  } catch (error) {
    console.error('Error in auto-backup function:', error);
    return new Response(JSON.stringify({ 
      error: 'Backup failed', 
      message: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
};

serve(handler);