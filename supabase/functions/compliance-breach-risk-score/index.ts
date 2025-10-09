// Compliance Breach Risk Score Calculator
// Computes risk scores for potential HIPAA breaches based on various factors

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface RiskFactors {
  affected_individuals: number;
  phi_types: string[];
  exposure_duration_days: number;
  data_encrypted: boolean;
  external_exposure: boolean;
  malicious_intent: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const factors: RiskFactors = await req.json();

    // Validate input
    if (factors.affected_individuals === undefined) {
      return new Response(
        JSON.stringify({ error: 'affected_individuals is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate risk score components
    let riskScore = 0;
    const scoreBreakdown: any = {};

    // 1. Number of affected individuals (0-50 points)
    if (factors.affected_individuals === 0) {
      scoreBreakdown.individuals = 0;
    } else if (factors.affected_individuals < 10) {
      scoreBreakdown.individuals = 5;
    } else if (factors.affected_individuals < 50) {
      scoreBreakdown.individuals = 10;
    } else if (factors.affected_individuals < 100) {
      scoreBreakdown.individuals = 15;
    } else if (factors.affected_individuals < 500) {
      scoreBreakdown.individuals = 25;
    } else {
      scoreBreakdown.individuals = 50;
    }
    riskScore += scoreBreakdown.individuals;

    // 2. Types of PHI exposed (0-30 points)
    const highRiskPHI = ['ssn', 'financial', 'diagnosis', 'treatment', 'prescription'];
    const phiTypesLower = (factors.phi_types || []).map(t => t.toLowerCase());
    const highRiskCount = phiTypesLower.filter(t => highRiskPHI.some(hr => t.includes(hr))).length;
    
    scoreBreakdown.phi_types = Math.min(highRiskCount * 10, 30);
    riskScore += scoreBreakdown.phi_types;

    // 3. Exposure duration (0-20 points)
    const duration = factors.exposure_duration_days || 0;
    if (duration === 0) {
      scoreBreakdown.duration = 0;
    } else if (duration <= 1) {
      scoreBreakdown.duration = 2;
    } else if (duration <= 7) {
      scoreBreakdown.duration = 5;
    } else if (duration <= 30) {
      scoreBreakdown.duration = 10;
    } else if (duration <= 90) {
      scoreBreakdown.duration = 15;
    } else {
      scoreBreakdown.duration = 20;
    }
    riskScore += scoreBreakdown.duration;

    // 4. Encryption status (0-15 points)
    scoreBreakdown.encryption = factors.data_encrypted ? 0 : 15;
    riskScore += scoreBreakdown.encryption;

    // 5. External exposure (0-15 points)
    scoreBreakdown.external = factors.external_exposure ? 15 : 0;
    riskScore += scoreBreakdown.external;

    // 6. Malicious intent (0-20 points)
    scoreBreakdown.malicious = factors.malicious_intent ? 20 : 0;
    riskScore += scoreBreakdown.malicious;

    // Determine risk level and recommendations
    let riskLevel: string;
    let notificationRequired: boolean;
    let hhsReportingRequired: boolean;
    let recommendations: string[];

    if (riskScore < 20) {
      riskLevel = 'Low';
      notificationRequired = false;
      hhsReportingRequired = false;
      recommendations = [
        'Document the incident internally',
        'Review and update relevant policies',
        'Conduct root cause analysis',
      ];
    } else if (riskScore < 50) {
      riskLevel = 'Medium';
      notificationRequired = factors.affected_individuals >= 10;
      hhsReportingRequired = false;
      recommendations = [
        'Conduct immediate investigation',
        'Document all findings',
        'Consider individual notification',
        'Review security controls',
        'Implement corrective actions',
      ];
    } else if (riskScore < 80) {
      riskLevel = 'High';
      notificationRequired = true;
      hhsReportingRequired = factors.affected_individuals >= 500;
      recommendations = [
        'Immediately notify affected individuals (within 60 days)',
        'Report to HHS if 500+ individuals affected',
        'Provide credit monitoring if appropriate',
        'Engage legal counsel',
        'Document comprehensive breach analysis',
        'Implement immediate remediation',
        'Review and update breach response plan',
      ];
    } else {
      riskLevel = 'Critical';
      notificationRequired = true;
      hhsReportingRequired = true;
      recommendations = [
        'IMMEDIATE: Notify affected individuals',
        'IMMEDIATE: Report to HHS',
        'IMMEDIATE: Engage legal counsel',
        'Consider media notification',
        'Offer credit monitoring and identity theft services',
        'Comprehensive forensic investigation',
        'Executive-level incident response',
        'Review cybersecurity insurance',
        'Prepare for potential regulatory action',
      ];
    }

    const response = {
      risk_score: riskScore,
      risk_level: riskLevel,
      score_breakdown: scoreBreakdown,
      notification_required: notificationRequired,
      hhs_reporting_required: hhsReportingRequired,
      recommendations,
      regulatory_info: {
        hhs_reporting_deadline: hhsReportingRequired ? '60 days from discovery' : 'Not required',
        individual_notification_deadline: notificationRequired ? '60 days from discovery' : 'Not required',
        media_notification_required: factors.affected_individuals >= 500,
      },
    };

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

