export const legalContactEmail = 'hello@admakai.com';
export const legalEffectiveDate = '29 October 2026';

type LegalSection = { title: string; paragraphs: string[] };
type LegalDocument = { title: string; intro: string; sections: LegalSection[] };

export const legalDocuments: Record<'privacy' | 'terms', LegalDocument> = {
  privacy: {
    title: 'Privacy policy',
    intro: 'How Admakai handles information when you visit our website, book a call, use your client account or share materials with our studio.',
    sections: [
      { title: '1. Who we are', paragraphs: [
        'Admakai is an AI advertising and creative production studio based in Dhaka, Bangladesh, and a sister concern of Branta Tech. This policy covers admakai.com and the Admakai booking and client account services.',
        `For privacy questions or requests about your information, contact ${legalContactEmail}.`,
      ] },
      { title: '2. Information you provide', paragraphs: [
        'When you book a call or submit an enquiry, we collect the details you enter: your name, email address, WhatsApp number, brand or company name, requested service, budget range, message and chosen appointment time. Optional fields are collected only when you provide them.',
        'For a client account, we process your sign-in email, account identifier and associated profile and client details, such as your name, WhatsApp number, brand and timezone. We also keep booking status, meeting links, shared call notes and records needed to manage the client relationship.',
        'If you upload project materials, we process the files and their names, sizes, types and storage references. These may include product photos, reference images or documents. Only upload personal information and materials that you are authorised to share; do not send passwords, payment-card details or unnecessary sensitive information.',
      ] },
      { title: '3. Information collected during use', paragraphs: [
        'A booking includes referral information, the page pathname, campaign tags in the URL (UTM parameters) and your browser user-agent string. We use this information to understand the source of an enquiry and troubleshoot booking problems.',
        'Our hosting and service providers may process technical connection information, such as IP addresses and request logs, to deliver and secure the service. The website also requests fonts from Google Fonts, which receives the connection information needed to serve those files.',
      ] },
      { title: '4. Why we use your information', paragraphs: [
        'We use your information to answer enquiries, schedule and manage calls, authenticate your account, connect verified accounts to their bookings, provide access to your files and call history, communicate about requested services, and prepare and deliver creative work.',
        'We also use necessary records to prevent abuse and duplicate bookings, maintain access controls and audit history, resolve support issues and meet applicable legal obligations. Where applicable law requires a legal basis, these activities rely on your request for services, our legitimate interest in operating a secure service, a legal obligation or consent where required.',
      ] },
      { title: '5. Google sign-in and Google user data', paragraphs: [
        'The current Admakai sign-in page uses an email sign-in link. Google sign-in is not currently offered by that page, and it does not request access to Gmail, Google Drive, Google Calendar, contacts or other Google account content.',
        'If Google sign-in is made available, the Google consent screen will identify the permissions requested. Basic sign-in information may include your Google account identifier, email address, name and profile picture. We will use that information only to authenticate you and create or maintain your Admakai account, with Supabase processing authentication on our behalf. We will update this policy before introducing additional Google-data access or a new purpose.',
        'Google account data will not be sold, used for personalised advertising or used to train general-purpose AI models. Admakai’s use and transfer of information received from Google APIs will adhere to the Google API Services User Data Policy, including its Limited Use requirements, where applicable.',
      ] },
      { title: '6. Sharing and service providers', paragraphs: [
        'Supabase provides our account authentication, database and private file storage. Our website hosting provider processes requests needed to serve the website. Authorised Admakai staff access client records and materials only as needed for their responsibilities; client accounts are restricted to their own records.',
        'When a commissioned project requires an external creative or AI production service, only materials needed for that work should be shared within the agreed production scope. A list of tools shown on our website does not mean your account or uploads are automatically sent to every tool.',
        'We do not sell personal information. We may disclose necessary information to comply with applicable law, protect the service or its users, or to a provider working on our behalf for the purposes described here. Service providers may process information outside Bangladesh, subject to their applicable terms and safeguards.',
      ] },
      { title: '7. Session storage and security', paragraphs: [
        'We use browser storage to keep your Supabase sign-in session and refresh it, and temporary session storage to remember the intended client page after sign-in. Signing out ends the active app session. These functions support account access rather than advertising tracking.',
        'We use authenticated access controls, database permissions and private storage with time-limited file links. No online system is completely secure. Keep your sign-in links private and sign out on shared devices.',
      ] },
      { title: '8. Retention and deletion', paragraphs: [
        'We retain account, booking, enquiry and project information for the period needed to provide services, maintain the client relationship, resolve disputes and meet legal or security requirements. The period depends on the record and its purpose; we do not claim a single automatic deletion deadline for all data.',
        'You can request deletion of an account, personal information or uploaded materials by emailing us. There is no self-service account deletion button at present. Some transaction, legal, security or audit records may need to be retained, and backup copies may remain until the provider’s normal backup lifecycle removes them. We will explain relevant limitations when handling your request.',
      ] },
      { title: '9. Your choices and requests', paragraphs: [
        `Email ${legalContactEmail} to request access to, correction of or deletion of your personal information, or to raise a concern about its use. Use the email associated with your booking or account where possible. We may verify your identity before releasing information or changing records; do not send passwords or sign-in links.`,
        'Depending on applicable law, you may also have rights to object to or restrict processing, withdraw consent or complain to an appropriate authority. Withdrawal does not affect processing that was lawful before withdrawal. If Google sign-in is enabled in the future, you can also revoke Admakai’s access in your Google account permissions; revocation alone does not delete existing Admakai records.',
      ] },
      { title: '10. Children, external links and updates', paragraphs: [
        'Admakai’s client services are intended for adults and authorised business representatives, not children under 18. If a child’s information has been submitted without appropriate permission, contact us so we can review and address it.',
        'External websites and meeting services have their own privacy policies. We may update this policy as our services change; the effective date above identifies the current version. Material changes to data use will be communicated where required.',
      ] },
    ],
  },
  terms: {
    title: 'Terms of service',
    intro: 'The terms for using Admakai’s website, booking services, client account and creative production services.',
    sections: [
      { title: '1. Admakai and these terms', paragraphs: [
        `Admakai is an AI advertising and creative production studio in Dhaka, Bangladesh, and a sister concern of Branta Tech. These terms apply to admakai.com and its booking and client account services. Contact us at ${legalContactEmail} with questions.`,
        'By using these services, you agree to these terms. If you do not agree, do not use the services. You must be at least 18 and have authority to act for any business you represent.',
      ] },
      { title: '2. Accounts and acceptable use', paragraphs: [
        'Provide accurate contact and project information. Keep sign-in links and account access private, and tell us promptly if you suspect unauthorised access. A verified account may be linked to earlier bookings made using the same verified email.',
        'Do not access other clients’ records, bypass security or booking limits, submit spam, upload malicious files, impersonate someone or use the service for unlawful, infringing or deceptive activity. We may restrict access when reasonably needed to prevent abuse, protect users or comply with law.',
      ] },
      { title: '3. Calls, enquiries and project agreements', paragraphs: [
        'A booking requests a call; its displayed status indicates whether it has been confirmed. Availability and meeting details can change. Tell us promptly if you cannot attend. A booking or enquiry does not by itself purchase a production package or create a paid project.',
        'Before paid work begins, we agree in writing on the brief, deliverables, production approach, price, payment schedule, timeline, approvals and any additional licensing. That written agreement governs project-specific matters and takes precedence if it conflicts with these general terms. Placeholder prices are not payable offers, and sample work or team entries labelled as samples are not claims about real client outcomes or identities.',
      ] },
      { title: '4. Client materials and consent', paragraphs: [
        'You retain ownership of materials you supply and permit us to use them to carry out the agreed work. You are responsible for having the necessary rights to supplied logos, images, footage, claims and other content, and for obtaining permission from identifiable people where required.',
        'Cloning a real face or voice requires written consent from the person or an appropriately authorised rights holder. We do not clone real people without permission. Do not upload confidential or sensitive information unrelated to the brief.',
      ] },
      { title: '5. AI production and disclosure', paragraphs: [
        'You choose the agreed production approach: director cut, hybrid or full AI. We will not change that choice without disclosure. Every delivery includes a one-page disclosure identifying generated, shot or handmade work and the models used.',
        'We use commercially licensed models, voices and music. AI-assisted outputs can contain errors or inconsistencies; you should review the final work, product claims and required advertising disclosures before publication. We do not guarantee advertising performance, sales or approval by an advertising platform.',
      ] },
      { title: '6. Deliverables, ownership and licensing', paragraphs: [
        'Approved final files belong to the client for digital use, with licensed music and AI voices. Broadcast and OTT licensing is available on request and should be confirmed before those uses. Third-party assets remain subject to their applicable licence conditions.',
        'Source files, working files and any additional rights should be specified in the written project agreement. These terms do not transfer ownership of Admakai’s website, brand, pre-existing tools or third-party software.',
      ] },
      { title: '7. Delivery, revisions and monthly plans', paragraphs: [
        'The agreed brief and package determine the delivery schedule. Timelines rely on receiving the required materials, permissions and feedback. We will discuss changes that affect scope or timing rather than silently changing the agreed work.',
        'Two revision rounds are included on every piece; packages that explicitly include more rounds retain that allowance. If the work still misses the brief, we discuss and fix it before more money changes hands. Extra deliverables or a new brief require a separately agreed scope.',
        'Monthly plans can be paused or cancelled monthly, and unused pieces do not roll over. The published monthly first-cut guarantee remains applicable: if the first cut is late, that month is free. The applicable package and written agreement identify the first-cut schedule.',
      ] },
      { title: '8. Payments, cancellation and refunds', paragraphs: [
        'Prices, currency, any applicable taxes and payment dates are confirmed in the written quotation or agreement. No payment-card details should be submitted through booking messages or uploads.',
        `For a project cancellation or refund request, email ${legalContactEmail}. Any project-specific cancellation or refund arrangements must be agreed in writing before payment. These terms do not create an additional blanket refund promise or limit rights that cannot be excluded under applicable law.`,
      ] },
      { title: '9. Files, privacy and third-party services', paragraphs: [
        'The client area gives you access to your own available calls, shared notes and uploaded materials. File removal is handled by authorised managers; contact us if you need an upload removed. Keep your own copies of important project files.',
        'Our Privacy Policy explains how we process account, booking and upload information. Supabase, meeting platforms and other external services may have their own terms. Their availability is not entirely within Admakai’s control.',
      ] },
      { title: '10. Availability and responsibility', paragraphs: [
        'We aim to keep the website and client services available, but maintenance, network issues and provider outages can cause interruptions. We may update services or restrict unsafe activity. Nothing in these terms guarantees uninterrupted access.',
        'Each party remains responsible for its own obligations and conduct. Nothing here excludes liability or consumer rights that applicable law does not permit to be excluded. Any project-specific liability arrangements must be stated in the written agreement rather than assumed from these website terms.',
      ] },
      { title: '11. Disputes and changes', paragraphs: [
        `Please first contact ${legalContactEmail} so we can try to resolve a concern directly. Applicable laws of Bangladesh govern these terms, subject to any mandatory rights or jurisdiction rules that apply to you and any valid project-specific written agreement.`,
        'We may update these terms as services change. The effective date above identifies the current version. Changes do not silently replace an existing signed project agreement, and material changes will be communicated where required.',
      ] },
    ],
  },
};