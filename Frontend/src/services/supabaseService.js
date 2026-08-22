import { supabase } from '../lib/supabase';

export const supabaseService = {
  // Fetch Leads
  async getLeads() {
    const { data, error } = await supabase
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // Insert a new manual or qualified lead
  async createLead(leadData) {
    const { data, error } = await supabase
      .from('leads')
      .insert([{
        ...leadData,
        created_at: new Date().toISOString()
      }])
      .select();
    if (error) throw error;
    return data[0];
  },

  // Update existing lead (Fix 2: Prevent duplicate creation on appt booking)
  async updateLead(id, updates) {
    const { data, error } = await supabase
      .from('leads')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0];
  },

  // Fetch Appointments
  async getAppointments() {
    const { data, error } = await supabase
      .from('appointments')
      .select('*')
      .order('appointment_date', { ascending: true });
    if (error) throw error;
    return data || [];
  },

  // Insert a new appointment
  async createAppointment(apptData) {
    const { data, error } = await supabase
      .from('appointments')
      .insert([{
        ...apptData,
        created_at: new Date().toISOString()
      }])
      .select();
    if (error) throw error;
    return data[0];
  },

  // Update Appointment Status or Notes
  async updateAppointment(id, updates) {
    const { data, error } = await supabase
      .from('appointments')
      .update(updates)
      .eq('id', id)
      .select();
    if (error) throw error;
    return data[0];
  },

  // Fetch Raw Logs
  async getConversationLogs() {
    const { data, error } = await supabase
      .from('conversation_logs')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  // Insert a single conversation log
  async createConversationLog(logData) {
    const payload = {
      lead_id: logData.lead_id || null,
      sender: logData.sender,
      message: logData.message,
      created_at: new Date().toISOString()
    };
    
    // Maintain compatibility with user_message/agent_response columns
    if (logData.sender === 'user') {
      payload.user_message = logData.message;
    } else {
      payload.agent_response = logData.message;
    }

    const { data, error } = await supabase
      .from('conversation_logs')
      .insert([payload])
      .select();
    if (error) throw error;
    return data[0];
  },

  // Bulk update historical logs
  async linkLogsToLead(logIds, leadId) {
    const { data, error } = await supabase
      .from('conversation_logs')
      .update({ lead_id: leadId })
      .in('id', logIds)
      .select();
    if (error) throw error;
    return data || [];
  }
};
