export const complianceTemplates = {
  '1': { name: 'Privacy Officer Designation Letter', content: `[ORGANIZATION LETTERHEAD]
Date: [DATE]
MEMORANDUM
TO: All Staff
FROM: [CEO/Administrator Name], [Title]
RE: Designation of HIPAA Privacy Officer

This memorandum serves as formal notice that [PRIVACY OFFICER NAME] has been designated as the HIPAA Privacy Officer for [ORGANIZATION NAME], effective [DATE].

As Privacy Officer, [NAME] will be responsible for:
1. Development and implementation of privacy policies and procedures
2. Training staff on privacy practices and procedures
3. Receiving and processing complaints concerning privacy practices
4. Ensuring compliance with HIPAA Privacy Rule requirements
5. Maintaining documentation of privacy-related activities
6. Serving as the primary contact for privacy-related inquiries

All privacy-related questions, concerns, or complaints should be directed to:
[PRIVACY OFFICER NAME], [TITLE], [PHONE NUMBER], [EMAIL ADDRESS]

Staff are expected to cooperate fully with [NAME] in carrying out these responsibilities.

Sincerely,
[CEO/Administrator Signature]
[Name], [Title]` },
  
  '2': { name: 'Security Officer Designation Letter', content: `[ORGANIZATION LETTERHEAD]
Date: [DATE]
MEMORANDUM
TO: All Staff
FROM: [CEO/Administrator Name], [Title]
RE: Designation of HIPAA Security Officer

This memorandum serves as formal notice that [SECURITY OFFICER NAME] has been designated as the HIPAA Security Officer for [ORGANIZATION NAME], effective [DATE].

As Security Officer, [NAME] will be responsible for:
1. Development and implementation of security policies and procedures
2. Conducting security risk assessments
3. Implementing and monitoring technical safeguards
4. Training staff on security practices
5. Investigating security incidents
6. Ensuring compliance with HIPAA Security Rule requirements
7. Maintaining documentation of security-related activities

All security-related questions, concerns, or incidents should be reported immediately to:
[SECURITY OFFICER NAME], [TITLE], [PHONE NUMBER], [EMAIL ADDRESS]

Sincerely,
[CEO/Administrator Signature]
[Name], [Title]` },
  
  '3': { name: 'Notice of Privacy Practices', content: `NOTICE OF PRIVACY PRACTICES
[ORGANIZATION NAME]
Effective Date: [DATE]

THIS NOTICE DESCRIBES HOW MEDICAL INFORMATION ABOUT YOU MAY BE USED AND DISCLOSED AND HOW YOU CAN GET ACCESS TO THIS INFORMATION.

Our Commitment to Your Privacy
We are committed to maintaining the privacy and confidentiality of your personal health information.

How We May Use and Disclose Your Health Information:
- Treatment: To provide, coordinate, or manage your health care services
- Payment: To obtain payment for services provided to you
- Health Care Operations: To improve the quality of care we provide

Your Rights Regarding Your Health Information:
- Request restrictions on uses and disclosures
- Request confidential communications
- Inspect and copy your health information
- Request amendments to your health information
- Receive an accounting of disclosures
- Receive a paper copy of this notice
- File a complaint

Contact our Privacy Officer:
[NAME], [PHONE], [EMAIL]

Patient Acknowledgment:
I acknowledge that I have received and reviewed this Notice of Privacy Practices.
Patient Name: ___________________________ Date: ___________` },
  
  '4': { name: 'Business Associate Agreement', content: `BUSINESS ASSOCIATE AGREEMENT

This Agreement is entered into on [DATE] by and between:

COVERED ENTITY: [Organization Name]
BUSINESS ASSOCIATE: [Business Associate Name]

WHEREAS, Covered Entity requires Business Associate to create, receive, maintain, or transmit Protected Health Information ("PHI");

1. OBLIGATIONS OF BUSINESS ASSOCIATE
- Use or disclose PHI only as permitted by this Agreement
- Implement appropriate safeguards to prevent unauthorized use/disclosure
- Report security incidents within 5 business days
- Ensure subcontractors agree to same restrictions
- Make PHI available to individuals within 30 days
- Document and provide accounting of disclosures

2. OBLIGATIONS OF COVERED ENTITY
- Provide Notice of Privacy Practices
- Notify of any restrictions affecting BA's use of PHI

3. TERM AND TERMINATION
- Terminable upon 30 days written notice for material breach
- Upon termination, BA shall return or destroy all PHI

IN WITNESS WHEREOF:
COVERED ENTITY: _______________ Date: __________
BUSINESS ASSOCIATE: ___________ Date: __________` },
  
  '5': { name: 'Breach Notification Letter - Individual', content: `[ORGANIZATION LETTERHEAD]
Date: [DATE]

[PATIENT NAME]
[ADDRESS]

Re: Notice of Privacy Breach

Dear [PATIENT NAME],

We are writing to notify you of a breach of your protected health information that occurred on [DATE OF BREACH].

What Happened:
[Provide brief description of what happened, including dates]

What Information Was Involved:
[List specific data elements: names, dates of birth, SSN, medical record numbers, diagnoses, etc.]

What We Are Doing:
- [Describe steps taken to investigate and mitigate]
- [Describe steps taken to prevent recurrence]
- [Describe notification to appropriate authorities]

What You Can Do:
- Review your medical records for any inaccuracies
- Monitor your accounts and credit reports for suspicious activity
- Place a fraud alert or security freeze on your credit files

For More Information:
Contact: [NAME], [TITLE], [PHONE NUMBER], [EMAIL]

We sincerely apologize for this incident.

Sincerely,
[SIGNATURE], [NAME], [TITLE]` },
  
  '6': { name: 'Breach Notification - HHS', content: `BREACH NOTIFICATION TO HHS - HIPAA Breach Report Form

SECTION 1: REPORTING ENTITY INFORMATION
Organization Name: _____________________
Contact Person: ________________________
Phone: _____________ Email: ____________
Type: □ Health Plan □ Provider □ Clearinghouse □ Business Associate

SECTION 2: BREACH INFORMATION
Date Discovered: ____________ Date of Breach: ____________
Description: ________________________________________
Type of PHI: □ Demographic □ Financial □ Clinical □ Other
Number of Individuals Affected: __________

SECTION 3: BREACH DETAILS
Type: □ Theft □ Loss □ Unauthorized Access □ Hacking □ Other
Location: □ Paper □ EMR □ Laptop □ Email □ Server □ Other
Was PHI Encrypted? □ Yes □ No

SECTION 4: NOTIFICATION
Date Individuals Notified: __________
Method: □ Mail □ Email □ Telephone
Date Media Notified (if 500+): __________

SECTION 5: MITIGATION
Steps taken to mitigate harm: _________________________
Steps to prevent recurrence: __________________________

CERTIFICATION:
Signature: ______________ Date: __________

Submit via HHS Breach Portal: https://ocrportal.hhs.gov` },
  
  '7': { name: 'Security Incident Report Form', content: `SECURITY INCIDENT REPORT FORM

SECTION 1: REPORTER INFORMATION
Reported By: _____________ Department: _____________
Date of Report: ____________

SECTION 2: INCIDENT DETAILS
Date/Time Occurred: __________ Discovered: __________
Incident Type (check all):
□ Unauthorized Access □ Disclosure □ Lost/Stolen Device
□ Hacking/Malware □ Phishing □ System Failure
□ Physical Security Breach □ Other: __________

Description: _______________________________________

SECTION 3: INFORMATION INVOLVED
Was PHI involved? □ Yes □ No □ Unknown
Number of patients affected: __________

SECTION 4: SYSTEMS AFFECTED
□ EMR □ Email □ Network Server □ Laptop
□ Mobile Device □ Paper Records □ Other: __________

SECTION 5: IMMEDIATE ACTIONS
Actions taken: ____________________________________
Incident contained? □ Yes □ No

SECTION 6: NOTIFICATION
Law enforcement contacted? □ Yes □ No
Affected individuals notified? □ Yes □ No

FOR SECURITY OFFICER USE:
Classification: □ Minor □ Moderate □ Severe
Breach requiring notification? □ Yes □ No
Assigned To: __________  Completed: __________

Security Officer Signature: __________ Date: __________` },
  
  '8': { name: 'Risk Assessment Worksheet', content: `HIPAA SECURITY RISK ASSESSMENT WORKSHEET

Organization: ________________ Date: __________
Completed By: _________________________________

Rate each area: Likelihood (1-5) × Impact (1-5) = Risk Score

1. ADMINISTRATIVE SAFEGUARDS
□ Risk analysis conducted
□ Risk management policies
□ Sanctions policy
□ System activity review
Risk Score: _____ Actions: _____________________

2. WORKFORCE SECURITY
□ Authorization procedures
□ Clearance procedures
□ Termination procedures
Risk Score: _____ Actions: _____________________

3. ACCESS MANAGEMENT
□ Access authorization
□ Access establishment/modification
□ Access termination
Risk Score: _____ Actions: _____________________

4. SECURITY TRAINING
□ Security reminders
□ Malware protection
□ Log-in monitoring
□ Password management
Risk Score: _____ Actions: _____________________

5. PHYSICAL SAFEGUARDS
□ Facility access controls
□ Workstation security
□ Device controls
Risk Score: _____ Actions: _____________________

6. TECHNICAL SAFEGUARDS
□ Unique user IDs
□ Emergency access
□ Automatic log-off
□ Encryption
Risk Score: _____ Actions: _____________________

RISK SUMMARY
High Priority (15-25): _____ Medium (8-14): _____ Low (1-7): _____

TOP RISKS TO ADDRESS:
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

Completed By: ______________ Date: __________
Security Officer: ____________ Date: __________` },
  
  '9': { name: 'Training Sign-In Sheet', content: `HIPAA TRAINING SIGN-IN SHEET

Training Topic: _____________________________________
Trainer: ___________________________________________
Date: _____________ Time: _________ Location: ______

TRAINING OBJECTIVES:
□ HIPAA Privacy Rule □ HIPAA Security Rule
□ Patient Rights □ Uses and Disclosures of PHI
□ Security Incidents and Breach Reporting
□ Business Associate Agreements
□ Other: __________

MATERIALS PROVIDED:
□ Training Manual □ Policy Handbook
□ Quick Reference Guide □ Other: __________

ATTENDEE ROSTER:
# | NAME | SIGNATURE | DEPARTMENT | DATE
1 |      |           |            |
2 |      |           |            |
3 |      |           |            |
4 |      |           |            |
5 |      |           |            |
6 |      |           |            |
7 |      |           |            |
8 |      |           |            |
9 |      |           |            |
10|      |           |            |

Total Attendees: _______

TRAINING EVALUATION:
Excellent: ___ Good: ___ Fair: ___ Poor: ___

Trainer Signature: ______________ Date: __________
File: Personnel Files and Training Records
Retain: Minimum 6 years` },
  
  '10': { name: 'Access Control Audit Checklist', content: `ACCESS CONTROL AUDIT CHECKLIST

Audit Period: _____________ Auditor: ______________
Date Completed: _____________

1. USER ACCESS REVIEW
□ All active accounts reviewed
□ Terminated users identified and disabled
□ User roles match job responsibilities
Total Active Accounts: _____ Action Required: _____

2. ADMINISTRATIVE ACCOUNTS
□ All admin accounts documented
□ Administrator access justified
□ No shared accounts
Total Admin Accounts: _____

3. PASSWORD MANAGEMENT
□ Password complexity enforced
□ Password expiration configured
□ Account lockout policies active
□ No weak passwords identified

4. ACCESS LOGS REVIEW
□ Failed login attempts reviewed
□ After-hours access reviewed
□ Break-the-glass access justified
Suspicious Activity: □ Yes □ No

5. TERMINATION PROCEDURES
□ All terminated users disabled
□ Physical access badges deactivated
□ Company devices returned
Number of Terminations: _____

6. EXTERNAL ACCESS
□ VPN access reviewed
□ Multi-factor authentication verified
□ Vendor access documented
□ Business Associate Agreements on file

AUDIT SUMMARY
Total Issues: _____ Critical: _____ High: _____ Medium: _____ Low: _____

KEY FINDINGS:
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

NEXT AUDIT DUE: _____________

Auditor Signature: _____________ Date: __________
Security Officer: ______________ Date: __________` },
  
  '11': { name: 'Annual HIPAA Self-Audit Tool', content: `ANNUAL HIPAA COMPLIANCE SELF-AUDIT TOOL

Organization: _____________ Audit Year: _____________
Completed By: _____________ Date: _____________

Rate: ✓ (Compliant), ⚠ (Needs Improvement), ✗ (Not Compliant)

PRIVACY RULE COMPLIANCE
□ Privacy Official designated Rating: _____
□ Notice of Privacy Practices current Rating: _____
□ Patient rights processes documented Rating: _____
□ Minimum necessary implemented Rating: _____
□ Authorization forms compliant Rating: _____

SECURITY RULE COMPLIANCE
□ Security Official designated Rating: _____
□ Risk analysis conducted (past 12 months) Rating: _____
□ Administrative safeguards Rating: _____
□ Physical safeguards Rating: _____
□ Technical safeguards Rating: _____

BREACH NOTIFICATION RULE
□ Breach response plan documented Rating: _____
□ Breach log maintained Rating: _____
Breaches this year: _____ Requiring notification: _____

TRAINING AND WORKFORCE
□ Initial and ongoing training provided Rating: _____
□ Training within 30 days of hire Rating: _____
□ Sanctions policy implemented Rating: _____
Training Completion Rate: _____%

BUSINESS ASSOCIATES
□ All BAs identified Rating: _____
□ Current BAAs on file Rating: _____
Number of BAs: _____ With Current BAAs: _____

DOCUMENTATION
□ All required policies documented Rating: _____
□ 6-year retention policy implemented Rating: _____
Last Policy Review: _____________

AUDIT SCORING
Compliant: _____ Needs Improvement: _____ Not Compliant: _____
Compliance Rate: _____%

OVERALL: □ Excellent (95-100%) □ Good (85-94%)
         □ Fair (75-84%) □ Needs Improvement (<75%)

PRIORITY ACTIONS:
1. _______________________________________________
2. _______________________________________________
3. _______________________________________________

Completed By: ______________ Date: __________
Compliance Officer: _________ Date: __________
Executive Approval: _________ Date: __________` },
  
  '12': { name: 'Incident Response Plan', content: `INCIDENT RESPONSE PLAN
[ORGANIZATION NAME]
Effective Date: [DATE]

PURPOSE: Establish procedures for responding to security incidents involving PHI.

INCIDENT RESPONSE TEAM
Security Officer: _____________ Phone: _________ Email: _________
Privacy Officer: ______________ Phone: _________ Email: _________
IT Manager: __________________ Phone: _________ Email: _________
Compliance Officer: ___________ Phone: _________ Email: _________

INCIDENT CLASSIFICATION
Level 1 - Low: No PHI breach, no notification required
Level 2 - Medium: Limited PHI exposure, may require notification
Level 3 - High: Significant PHI breach, notification required

RESPONSE PROCEDURES

PHASE 1: DETECTION (0-2 hours)
□ Incident detected/reported
□ Security Officer notified
□ Incident Response Team activated
Contact: [PHONE], After Hours: [PHONE]

PHASE 2: CONTAINMENT (2-8 hours)
□ Affected systems isolated
□ Unauthorized access blocked
□ Evidence preserved
□ Initial damage assessment
Actions: Disable accounts, Change passwords, Isolate systems, Collect logs

PHASE 3: INVESTIGATION (1-5 days)
□ Root cause identified
□ Scope determined
□ PHI involvement confirmed
□ Number of affected individuals determined
□ Risk assessment completed

PHASE 4: MITIGATION (3-10 days)
□ Vulnerabilities addressed
□ Systems restored
□ Security controls enhanced
□ Normal operations resumed

PHASE 5: NOTIFICATION (within 60 days if breach)
□ Individual notifications prepared
□ Affected individuals notified
□ HHS notified (if 500+)
□ Media notified (if 500+ in jurisdiction)
Requirements: First-class mail within 60 days

PHASE 6: POST-INCIDENT REVIEW (within 30 days)
□ Post-incident meeting conducted
□ Root cause analysis completed
□ Corrective action plan developed
□ Policy updates identified
□ Training needs assessed

DOCUMENTATION
All incidents documented with:
- Incident report form
- Investigation notes
- Risk assessment
- Breach determination
- Notification records
- Corrective action plan
Retain: Minimum 6 years

COMMUNICATION PROTOCOLS
Internal: Security Officer coordinates
External: All communications approved by executive team
Media Contact: [NAME] [PHONE]

TRAINING
All workforce must know how to report incidents and participate in annual training.

PLAN REVIEW
Review annually, after incidents, and when regulations/systems change.

APPROVAL
Security Officer: __________ Date: __________
Privacy Officer: ___________ Date: __________
CEO: _____________________ Date: __________` },
};

export function generateTemplate(templateId: string): string {
  const template = complianceTemplates[templateId as keyof typeof complianceTemplates];
  if (!template) {
    throw new Error(`Template ${templateId} not found`);
  }
  return template.content;
}

export function downloadTemplate(templateId: string, templateName: string): void {
  const content = generateTemplate(templateId);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${templateName.replace(/[^a-zA-Z0-9 ]/g, '_')}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
