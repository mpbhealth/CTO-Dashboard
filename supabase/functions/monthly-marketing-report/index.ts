import { createClient } from 'npm:@supabase/supabase-js@2.39.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface PropertySummary {
  property_id: string;
  property_name: string;
  total_sessions: number;
  total_users: number;
  total_conversions: number;
  total_revenue: number;
  avg_bounce_rate: number;
  top_traffic_source: string;
  growth_percentage: number;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  try {
    // Create Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get start and end of current month
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();
    
    const startOfMonth = new Date(currentYear, currentMonth, 1).toISOString().split('T')[0];
    const endOfMonth = new Date(currentYear, currentMonth + 1, 0).toISOString().split('T')[0];
    
    // Get start of previous month for comparison
    const startOfPrevMonth = new Date(currentYear, currentMonth - 1, 1).toISOString().split('T')[0];
    const endOfPrevMonth = new Date(currentYear, currentMonth, 0).toISOString().split('T')[0];

    // Fetch all properties
    const { data: properties, error: propertiesError } = await supabase
      .from('marketing_properties')
      .select('*');

    if (propertiesError) {
      throw new Error(`Error fetching properties: ${propertiesError.message}`);
    }

    if (!properties || properties.length === 0) {
      return new Response(JSON.stringify({ message: 'No properties found' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const propertySummaries: PropertySummary[] = [];

    // Generate summary for each property
    for (const property of properties) {
      // Fetch current month metrics
      const { data: currentMetrics } = await supabase
        .from('marketing_metrics')
        .select('*')
        .eq('property_id', property.id)
        .gte('date', startOfMonth)
        .lte('date', endOfMonth);

      // Fetch previous month metrics for comparison
      const { data: prevMetrics } = await supabase
        .from('marketing_metrics')
        .select('*')
        .eq('property_id', property.id)
        .gte('date', startOfPrevMonth)
        .lte('date', endOfPrevMonth);

      if (!currentMetrics || currentMetrics.length === 0) {
        continue; // Skip properties with no current data
      }

      // Calculate current month totals
      const currentTotals = currentMetrics.reduce((acc, metric) => ({
        sessions: acc.sessions + metric.sessions,
        users: acc.users + metric.users,
        conversions: acc.conversions + metric.conversions,
        revenue: acc.revenue + metric.revenue,
        bounceRateSum: acc.bounceRateSum + metric.bounce_rate,
        count: acc.count + 1
      }), { sessions: 0, users: 0, conversions: 0, revenue: 0, bounceRateSum: 0, count: 0 });

      // Calculate previous month totals
      const prevTotals = (prevMetrics || []).reduce((acc, metric) => ({
        sessions: acc.sessions + metric.sessions,
        users: acc.users + metric.users,
        conversions: acc.conversions + metric.conversions,
        revenue: acc.revenue + metric.revenue
      }), { sessions: 0, users: 0, conversions: 0, revenue: 0 });

      // Calculate growth percentage
      const growthPercentage = prevTotals.sessions > 0 
        ? ((currentTotals.sessions - prevTotals.sessions) / prevTotals.sessions) * 100 
        : 0;

      // Find top traffic source
      const sourceMap = new Map();
      currentMetrics.forEach(metric => {
        const source = metric.traffic_source || 'Direct';
        sourceMap.set(source, (sourceMap.get(source) || 0) + metric.sessions);
      });
      
      const topSource = Array.from(sourceMap.entries())
        .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Direct';

      propertySummaries.push({
        property_id: property.id,
        property_name: property.name,
        total_sessions: currentTotals.sessions,
        total_users: currentTotals.users,
        total_conversions: currentTotals.conversions,
        total_revenue: currentTotals.revenue,
        avg_bounce_rate: currentTotals.count > 0 ? currentTotals.bounceRateSum / currentTotals.count : 0,
        top_traffic_source: topSource,
        growth_percentage: Math.round(growthPercentage * 100) / 100
      });
    }

    // Generate email content
    const emailContent = generateEmailContent(propertySummaries, startOfMonth, endOfMonth);
    
    // In a real implementation, you would send emails here
    // For now, we'll just log the report and store it
    console.log('Monthly Marketing Report Generated:', emailContent);

    // Store the report in the database for audit purposes
    await supabase
      .from('sync_logs')
      .insert([{
        service: 'email_reports',
        operation: 'monthly_report',
        status: 'success',
        message: `Monthly marketing report generated for ${propertySummaries.length} properties`,
        details: { 
          properties_count: propertySummaries.length,
          report_period: `${startOfMonth} to ${endOfMonth}`,
          summaries: propertySummaries
        },
        records_processed: propertySummaries.length
      }]);

    return new Response(JSON.stringify({ 
      success: true,
      properties_processed: propertySummaries.length,
      report_content: emailContent,
      message: 'Monthly marketing report generated successfully'
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating monthly report:', error);
    
    // Log the error
    try {
      const supabase = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );
      
      await supabase
        .from('sync_logs')
        .insert([{
          service: 'email_reports',
          operation: 'monthly_report',
          status: 'failed',
          message: error.message || 'Unknown error occurred',
          details: { error: error.toString() },
          records_processed: 0
        }]);
    } catch (logError) {
      console.error('Failed to log error:', logError);
    }

    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred generating the monthly report' }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function generateEmailContent(summaries: PropertySummary[], startDate: string, endDate: string): string {
  const totalSessions = summaries.reduce((sum, s) => sum + s.total_sessions, 0);
  const totalRevenue = summaries.reduce((sum, s) => sum + s.total_revenue, 0);
  const avgGrowth = summaries.length > 0 
    ? summaries.reduce((sum, s) => sum + s.growth_percentage, 0) / summaries.length 
    : 0;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Monthly Marketing Report</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #f8fafc; }
    .container { max-width: 600px; margin: 0 auto; background-color: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white; }
    .content { padding: 30px; }
    .metric-card { background-color: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px; border-left: 4px solid #667eea; }
    .metric-title { font-size: 14px; color: #64748b; font-weight: 600; margin-bottom: 8px; }
    .metric-value { font-size: 28px; font-weight: bold; color: #1e293b; }
    .metric-change { font-size: 14px; margin-top: 4px; }
    .positive { color: #10b981; }
    .negative { color: #ef4444; }
    .property-section { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0; }
    .property-name { font-size: 18px; font-weight: bold; color: #1e293b; margin-bottom: 15px; }
    .property-metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 15px; }
    .small-metric { text-align: center; padding: 15px; background-color: #f1f5f9; border-radius: 6px; }
    .small-metric-value { font-size: 20px; font-weight: bold; color: #334155; }
    .small-metric-label { font-size: 12px; color: #64748b; margin-top: 4px; }
    .footer { text-align: center; padding: 20px; background-color: #f1f5f9; color: #64748b; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="margin: 0; font-size: 24px;">📊 Monthly Marketing Report</h1>
      <p style="margin: 10px 0 0 0; opacity: 0.9;">${startDate} to ${endDate}</p>
    </div>
    
    <div class="content">
      <div class="metric-card">
        <div class="metric-title">TOTAL SESSIONS</div>
        <div class="metric-value">${totalSessions.toLocaleString()}</div>
        <div class="metric-change ${avgGrowth >= 0 ? 'positive' : 'negative'}">
          ${avgGrowth >= 0 ? '↗' : '↘'} ${Math.abs(avgGrowth).toFixed(1)}% vs last month
        </div>
      </div>
      
      <div class="metric-card">
        <div class="metric-title">TOTAL REVENUE</div>
        <div class="metric-value">$${totalRevenue.toLocaleString()}</div>
        <div class="metric-change">Across ${summaries.length} properties</div>
      </div>

      ${summaries.map(property => `
        <div class="property-section">
          <div class="property-name">${property.property_name}</div>
          <div class="property-metrics">
            <div class="small-metric">
              <div class="small-metric-value">${property.total_sessions.toLocaleString()}</div>
              <div class="small-metric-label">Sessions</div>
            </div>
            <div class="small-metric">
              <div class="small-metric-value">${property.total_users.toLocaleString()}</div>
              <div class="small-metric-label">Users</div>
            </div>
            <div class="small-metric">
              <div class="small-metric-value">${property.total_conversions}</div>
              <div class="small-metric-label">Conversions</div>
            </div>
            <div class="small-metric">
              <div class="small-metric-value">${Math.round(property.avg_bounce_rate * 100)}%</div>
              <div class="small-metric-label">Bounce Rate</div>
            </div>
          </div>
          <p style="margin: 0; color: #64748b; font-size: 14px;">
            <strong>Top Source:</strong> ${property.top_traffic_source} • 
            <strong>Growth:</strong> 
            <span class="${property.growth_percentage >= 0 ? 'positive' : 'negative'}">
              ${property.growth_percentage >= 0 ? '+' : ''}${property.growth_percentage}%
            </span>
          </p>
        </div>
      `).join('')}
    </div>
    
    <div class="footer">
      <p>Generated by MPB Health Marketing Analytics Dashboard</p>
      <p>Report generated on ${new Date().toLocaleDateString()}</p>
    </div>
  </div>
</body>
</html>
  `.trim();
}