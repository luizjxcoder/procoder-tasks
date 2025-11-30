// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";



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

    // Se for backup triggered, processar todos os backups pendentes
    if (backupType === 'triggered') {
      const { data: pendingBackups, error: pendingError } = await supabase
        .from('backup_logs')
        .select('user_id')
        .eq('backup_type', 'triggered')
        .eq('status', 'pending')
        .order('created_at', { ascending: true });

      if (pendingError) {
        console.error('Error fetching pending backups:', pendingError);
        throw new Error('Failed to fetch pending backups');
      }

      if (!pendingBackups || pendingBackups.length === 0) {
        console.log('No pending backups to process');
        return new Response(JSON.stringify({
          success: true,
          message: 'No pending backups to process'
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Obter usuários únicos com backups pendentes
      const uniqueUserIds = [...new Set(pendingBackups.map(b => b.user_id).filter(Boolean))];
      
      console.log(`Processing ${uniqueUserIds.length} users with pending backups`);

      let processedCount = 0;
      for (const userId of uniqueUserIds) {
        try {
          await processBackupForUser(supabase, userId as string, 'triggered');
          processedCount++;
        } catch (error) {
          console.error(`Error processing backup for user ${userId}:`, error);
        }
      }

      return new Response(JSON.stringify({
        success: true,
        message: `Processed ${processedCount} backups`,
        processedUsers: processedCount
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Para backups manuais e scheduled, processar normalmente
    if (!userId && backupType !== 'scheduled') {
      throw new Error('userId is required for manual backups');
    }

    const result = await processBackupForUser(supabase, userId as string, backupType);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

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

async function processBackupForUser(
  supabase: any,
  userId: string,
  backupType: string
): Promise<any> {
  console.log(`Processing backup for user ${userId}, type: ${backupType}`);

  // Criar log de backup principal
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
    // Buscar todos os dados do usuário
    const [tasksData, projectsData, customersData, salesData, briefingsData, notesData, profileData] = await Promise.all([
      supabase.from('tasks').select('*').eq('user_id', userId),
      supabase.from('projects').select('*').eq('user_id', userId),
      supabase.from('customers').select('*').eq('user_id', userId),
      supabase.from('sales').select('*').eq('user_id', userId),
      supabase.from('design_briefings').select('*').eq('user_id', userId),
      supabase.from('notes').select('*').eq('user_id', userId),
      supabase.from('profiles').select('*').eq('user_id', userId).single()
    ]);

    // Estruturar dados para backup
    const backupData = {
      timestamp: new Date().toISOString(),
      version: '1.0.0',
      backup_type: backupType,
      user_id: userId,
      profile: profileData.data,
      data: {
        tasks: tasksData.data || [],
        projects: projectsData.data || [],
        customers: customersData.data || [],
        sales: salesData.data || [],
        design_briefings: briefingsData.data || [],
        notes: notesData.data || []
      },
      counts: {
        tasks: tasksData.data?.length || 0,
        projects: projectsData.data?.length || 0,
        customers: customersData.data?.length || 0,
        sales: salesData.data?.length || 0,
        design_briefings: briefingsData.data?.length || 0,
        notes: notesData.data?.length || 0
      }
    };

    const fileName = `${userId}/backup-${backupType}-${new Date().toISOString().split('T')[0]}-${Date.now()}.json`;
    const backupContent = JSON.stringify(backupData, null, 2);
    const backupBlob = new Blob([backupContent], { type: 'application/json' });

    // Upload backup para storage
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

    // Atualizar log principal com sucesso
    await supabase
      .from('backup_logs')
      .update({
        status: 'success',
        file_path: fileName,
        file_size: backupContent.length
      })
      .eq('id', logEntry.id);

    // Marcar logs pendentes como processados
    if (backupType === 'triggered') {
      await supabase
        .from('backup_logs')
        .update({ status: 'processed' })
        .eq('user_id', userId)
        .eq('backup_type', 'triggered')
        .eq('status', 'pending');
    }

    // Atualizar configurações de backup do usuário
    await supabase
      .from('backup_settings')
      .upsert({
        user_id: userId,
        last_backup_at: new Date().toISOString()
      }, {
        onConflict: 'user_id',
        ignoreDuplicates: false
      });

    return {
      success: true,
      message: 'Backup created successfully',
      fileName,
      size: backupContent.length,
      timestamp: new Date().toISOString(),
      recordsCount: Object.values(backupData.counts).reduce((a, b) => a + b, 0)
    };

  } catch (backupError) {
    console.error('Backup process failed:', backupError);
    
    // Atualizar log com erro
    await supabase
      .from('backup_logs')
      .update({
        status: 'failed',
        error_message: backupError.message
      })
      .eq('id', logEntry.id);

    throw backupError;
  }
}

serve(handler);