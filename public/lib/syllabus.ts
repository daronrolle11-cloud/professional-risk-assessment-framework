export interface SyllabusModule {
  title: string;
  topics: string[];
}

export interface CourseSyllabus {
  courseId: string;
  description: string;
  objectives: string[];
  modules: SyllabusModule[];
  assessmentMethod: string;
  certificationType: string;
}

export const SYLLABUS_DATA: Record<string, CourseSyllabus> = {
  orientation: {
    courseId: "orientation",
    description: "Foundational safety induction for all personnel entering active job sites in The Bahamas.",
    objectives: [
      "Identify common site hazards",
      "Understand rights and responsibilities under HSW Act 2002",
      "Learn emergency evacuation procedures",
      "Demonstrate basic PPE use"
    ],
    modules: [
      { title: "Legal Framework", topics: ["HSW Act 2002 (Ch. 321C) Overview", "Duty of Care: Employer vs Employee", "Reporting Hazards to the Safety Committee"] },
      { title: "General Site Safety", topics: ["Housekeeping Standards", "Safety Signage Meanings", "Walkway & Access Rules"] },
      { title: "Personal Protection", topics: ["Hard Hat Categories", "Eye & Face Protection", "Footwear Standards"] },
      { title: "Emergency Action", topics: ["Fire Response", "Hurricane Watch/Warning Procedures", "First Aid Station Locations"] }
    ],
    assessmentMethod: "Multiple-choice exam (80% pass threshold)",
    certificationType: "BCSO Site Safety Access Card"
  },
  "fall-protection": {
    courseId: "fall-protection",
    description: "Comprehensive training for working at height, covering collective and personal fall protection systems.",
    objectives: [
      "Select appropriate fall protection equipment",
      "Inspect harnesses and lanyards for defects",
      "Calculate fall clearance distances",
      "Execute basic self-rescue"
    ],
    modules: [
      { title: "Hierarchy of Fall Control", topics: ["Elimination (Ground Level Work)", "Prevention (Guardrails)", "Protection (Fall Arrest)"] },
      { title: "Equipment Inspection", topics: ["Harness Webbing Check", "D-Ring Integrity", "Lanyard Energy Absorber Validation"] },
      { title: "Anchorage Systems", topics: ["Structural Integrity", "Temporary vs Permanent Anchors", "Improper Anchorage Identification"] },
      { title: "Rescue Planning", topics: ["Suspension Trauma Awareness", "Rescue Kit Deployment", "Emergency Contact Chain"] }
    ],
    assessmentMethod: "Written exam + Practical harness donning and inspection test",
    certificationType: "Certificate of Technical Competence (Fall Protection)"
  },
  "heat-stress": {
    courseId: "heat-stress",
    description: "Bahamas-specific environmental safety training addressing extreme tropical heat conditions.",
    objectives: [
      "Recognise symptoms of heat exhaustion and heat stroke",
      "Implement work-rest cycles based on WBGT index",
      "Maintain proper hydration protocols"
    ],
    modules: [
      { title: "Physiology of Heat", topics: ["Core Temp Regulation", "Dehydration Indicators", "Acclimatization Periods"] },
      { title: "Prevention Protocols", topics: ["Hydration Schedules", "Shade Provision", "Buddy System Implementation"] },
      { title: "Emergency Response", topics: ["Cooling Techniques", "Initial Medical Care", "Evacuation Decision Matrix"] }
    ],
    assessmentMethod: "Written assessment + Oral scenario response",
    certificationType: "Environmental Safety Endorsement"
  },
  "hurricane-prep": {
    courseId: "hurricane-prep",
    description: "Specialised training for site managers and foremen on storm securing and recovery protocols.",
    objectives: [
      "Interpret NHC hurricane watches and warnings",
      "Execute site demobilization according to BCSO countdown",
      "Document site state for insurance compliance"
    ],
    modules: [
      { title: "The BCSO Countdown", topics: ["120h Inventory Phase", "72h Securing Phase", "48h Documentation Phase", "24h Evacuation"] },
      { title: "Physical Securing", topics: ["Crane/Scaffold Dismantle", "Loose Material Anchoring", "Hazardous Material Isolation"] },
      { title: "Post-Storm Recovery", topics: ["Integrity Assessment", "Electrical Testing Before Start", "Flood Risk Evaluation"] }
    ],
    assessmentMethod: "Plan verification exercise + Practical securing test",
    certificationType: "Hurricane Readiness Lead Certificate"
  },
  "confined-space": {
    courseId: "confined-space",
    description: "Entry and monitoring training for pits, tanks, and other enclosed spaces with atmospheric hazards.",
    objectives: [
      "Define permit-required confined spaces",
      "Operate atmospheric monitoring equipment",
      "Understand 'Attendant' vs 'Entrant' roles"
    ],
    modules: [
      { title: "Hazard Recognition", topics: ["Oxygen Deficiency", "Toxic Gas Detection", "Physical Entrapment Risks"] },
      { title: "Permit System", topics: ["Hot Work within Spaces", "Isolation (LOTO)", "Communication Logs"] },
      { title: "Entry Equipment", topics: ["Ventilation Blowers", "Tripod & Winch Setup", "Intrinsic Safety for Tools"] }
    ],
    assessmentMethod: "Written exam + Practical entry and retrieval demonstration",
    certificationType: "Confined Space Specialist"
  },
  "first-aid": {
    courseId: "first-aid",
    description: "Standard First Aid, CPR, and AED training tailored for industrial and maritime environments.",
    objectives: [
      "Provide immediate life-saving care",
      "Manage trauma and bleeding",
      "Utilise AED equipment correctly"
    ],
    modules: [
      { title: "Primary Assessment", topics: ["Scene Safety", "ABC Protocol", "Emergency Activation"] },
      { title: "Trauma Care", topics: ["Haemorrhage Control (Tourniquets)", "Shock Management", "Fracture Stabilization"] },
      { title: "Sudden Cardiac Arrest", topics: ["Compression-Only CPR", "AED Interface", "Airway Management"] }
    ],
    assessmentMethod: "Skills-based practical assessment + Written exam",
    certificationType: "First Aid / CPR Provider (BCSO Accredited)"
  },
  scaffold: {
    courseId: "scaffold",
    description: "Technical training for the safe assembly, alteration, and dismantling of mobile and fixed scaffold systems.",
    objectives: ["Identify scaffold components and load capacities", "Execute safe tie-in and bracing techniques", "Conduct pre-shift scaffold inspections"],
    modules: [
      { title: "Foundations & Loading", topics: ["Sole boards and base plates", "Leg load calculations", "Platform boarding rules"] },
      { title: "Structural Integrity", topics: ["Ledger and transom spacing", "Diagonal bracing patterns", "Guardrail and toe-board installation"] },
      { title: "Access & Use", topics: ["Ladder securing", "Overloading prevention", "Weather-related stability"] }
    ],
    assessmentMethod: "Practical assembly exercise + Theory exam",
    certificationType: "Scaffold Competent Person"
  },
  "hot-work": {
    courseId: "hot-work",
    description: "Safety protocols for welding, cutting, and other spark-producing activities in high-risk environments.",
    objectives: ["Implement Hot Work Permit systems", "Establish effective fire watches", "Manage combustible materials near work zones"],
    modules: [
      { title: "Permit Control", topics: ["Pre-work site inspection", "Gas testing protocols", "Permit sign-off flow"] },
      { title: "Fire Prevention", topics: ["Clearing the 35ft radius", "Fire blanket deployment", "Fire watch duties (during/post work)"] }
    ],
    assessmentMethod: "Written assessment + Permit simulation",
    certificationType: "Hot Work Safety Supervisor"
  },
  "crane-signal": {
    courseId: "crane-signal",
    description: "Standard hand and radio signaling protocols for crane and heavy lifting operations.",
    objectives: ["Execute standard hand signals flawlessly", "Maintain clear radio communications", "Understand load charts and boom angles"],
    modules: [
      { title: "Standard Signaling", topics: ["ASME hand signals", "Verbal radio protocols", "Blind-lift coordination"] },
      { title: "Crane Dynamics", topics: ["Center of gravity", "Boom deflection", "Swing radius hazards"] }
    ],
    assessmentMethod: "Practical signaling demonstration + Voice-comms test",
    certificationType: "Qualified Signalperson"
  },
  "electrical-safety": {
    courseId: "electrical-safety",
    description: "General electrical hazard awareness for non-trade personnel working near power systems.",
    objectives: ["Recognise electrical hazards on site", "Understand LOTO (Lockout/Tagout) indicators", "Respond to electrical emergencies safely"],
    modules: [
      { title: "The Basics of Electricity", topics: ["Amperage vs Voltage", "Conductive paths", "Grounding principles"] },
      { title: "Hazard Recognition", topics: ["Extension cord safety", "GFCI importance", "Water/Wet site electrical risks"] }
    ],
    assessmentMethod: "Written quiz",
    certificationType: "General Electrical Awareness"
  },
  "marine-safety": {
    courseId: "marine-safety",
    description: "Specialised safety standards for shipyards, marina docks, and vessel refit operations.",
    objectives: ["Manage 'Working over Water' risks", "Execute dockside fire safety", "Handle marine hazardous materials"],
    modules: [
      { title: "Water Hazards", topics: ["PFD requirements", "Man-overboard response", "Tidal movement safety"] },
      { title: "Shipyard Risks", topics: ["Shore power safety", "Vessel boarding protocols", "Confined hull spaces"] }
    ],
    assessmentMethod: "Practical water rescue simulation + Written exam",
    certificationType: "Marine Safety Specialist"
  },
  hazcom: {
    courseId: "hazcom",
    description: "Hazard Communication training aligned with the Globally Harmonized System (GHS) for chemical safety.",
    objectives: ["Interpret Safety Data Sheets (SDS)", "Recognise chemical pictograms", "Ensure proper container labelling"],
    modules: [
      { title: "The GHS System", topics: ["Label elements", "Signal words (Danger vs Warning)", "Pictogram meanings"] },
      { title: "Chemical Management", topics: ["SDS 16-section structure", "Spill response basics", "Storage compatibility"] }
    ],
    assessmentMethod: "Label recognition test + SDS lookup exercise",
    certificationType: "HazCom/GHS Competency"
  }
};

export function getSyllabus(id: string): CourseSyllabus | null {
  return SYLLABUS_DATA[id] || null;
}
