// Curated bull/bear talking points per stock to show 3–5 quick comments
// Used by StockCard; falls back to legacy single-line bull/bear if missing.

export const STOCK_BULLETS = {
  NVDA: {
    bull: [
      "Blackwell and Hopper capacity is sold out well into FY26 — pricing power intact.",
      "Data center GPU share still >80%, keeping a wide moat while CUDA remains the standard.",
      "Recurring AI software (CUDA/AI Enterprise) deepens lock-in beyond the silicon cycle.",
    ],
    bear: [
      "Trades at a perfection multiple; any AI capex pause could compress it fast.",
      "Hyperscaler ASICs (TPU, Trainium, Maia) nibble at inference and training share.",
      "Export controls and China mix remain ongoing headline and demand risks.",
    ],
  },
  META: {
    bull: [
      "Reels + Advantage+ ad stack drives both engagement and CPM uplift simultaneously.",
      "Llama open models position Meta as an AI platform with minimal incremental capex.",
      "$60B+ buyback and rising margins give lots of EPS leverage even on mid-teens growth.",
    ],
    bear: [
      "Reality Labs is still a multi‑billion dollar annual loss with unclear consumer pull.",
      "EU/US regulatory pressure could hit data flows, App Store policies, and targeting.",
      "TikTok ban outcome is uncertain; if it survives, competitive intensity stays high.",
    ],
  },
  AAPL: {
    bull: [
      "Services run-rate near $100B with 70%+ gross margins keeps EPS compounding.",
      "Apple Intelligence + iPhone 16 cycle should nudge upgrades and ASP higher.",
      "Wearables and Vision Pro expand the installed base where Apple monetizes recurring.",
    ],
    bear: [
      "China iPhone share under pressure from Huawei; geopolitics can hit volumes quickly.",
      "Hardware-heavy mix caps margin upside if services growth slows.",
      "Antitrust cases on App Store take rates threaten a key profit pool.",
    ],
  },
  AMZN: {
    bull: [
      "AWS growth is re-accelerating to high teens with GenAI services layered on top.",
      "Ads business is a $50B+ high-margin flywheel inside retail search.",
      "Regionalized fulfillment keeps improving retail margins and delivery speed.",
    ],
    bear: [
      "Massive AI capex surge hits FCF near term with uncertain ROIC timing.",
      "Antitrust scrutiny (US/EU) could restrict marketplace and ads bundling.",
      "Retail still low-margin; consumer slowdown would flow straight to earnings.",
    ],
  },
  MSFT: {
    bull: [
      "Copilot attach lifts ARPU across M365 and Windows — monetization already visible.",
      "Azure AI usage keeps cloud growth outpacing peers with strong operating leverage.",
      "Diversified stack (Office, LinkedIn, GitHub, Gaming) spreads AI upside widely.",
    ],
    bear: [
      "Cloud price wars with AWS/GOOG could pressure margins if AI workloads commoditize.",
      "Activision integration and gaming regulation are still execution risks.",
      "PC refresh tailwind fades after 2025; comps get tougher without AI lift.",
    ],
  },
  GOOGL: {
    bull: [
      "Search monetization still scales with AI summaries; ad load can be tuned dynamically.",
      "YouTube Shorts and CTV ads provide multi‑billion dollar incremental runway.",
      "Google Cloud profitable and growing 25–30% with strong AI tooling attach.",
    ],
    bear: [
      "DOJ antitrust outcome could unwind default search distribution deals.",
      "AI chat answers cannibalize classic search queries and could dent ad clicks.",
      "Capex rising sharply for TPU buildouts; ROIC needs to prove out.",
    ],
  },
  PLTR: {
    bull: [
      "AIP boot camps convert pilots to production fast — rare enterprise AI traction.",
      "Government base is sticky and funds steady cash flow to fuel commercial growth.",
      "High gross margins mean operating leverage if growth stays >30%.",
    ],
    bear: [
      "196x earnings bakes in hyper‑growth; any slowdown triggers re‑rating.",
      "Stock-based comp dilution remains elevated, pressuring per-share metrics.",
      "Dependence on large government contracts concentrates revenue risk.",
    ],
  },
  AMD: {
    bull: [
      "MI300X is the primary alternative to NVIDIA for hyperscaler AI buildouts.",
      "Zen 5 keeps client/server CPU roadmap competitive versus Intel.",
      "Gaming and embedded recovery add cyclical upside into 2025.",
    ],
    bear: [
      "CUDA/AI software moat still favors NVIDIA; ROCm adoption lags.",
      "Gross margins sensitive to mix if GPUs ramp slower than expected.",
      "PC cycle could cool again after the AI PC burst, hitting client revenue.",
    ],
  },
  CRM: {
    bull: [
      "Agentforce/Einstein makes AI a natural upsell across the entire CRM footprint.",
      "Data Cloud triple-digit growth boosts multi-product retention and ARPU.",
      "Operating margin north of 30% gives room for sustained buybacks.",
    ],
    bear: [
      "Growth deceleration from 20%+ to mid-teens risks multiple compression.",
      "Microsoft Dynamics and ServiceNow target the same enterprise wallets.",
      "Heavy reliance on large enterprise deals makes revenue lumpy in downturns.",
    ],
  },
  UBER: {
    bull: [
      "First GAAP-profitable year proves the model; bookings still compounding double digits.",
      "Network scale in both Mobility and Delivery is hard for new entrants to match.",
      "Autonomous partnerships (Waymo/WeRide) give optionality on robotaxi upside without capex.",
    ],
    bear: [
      "Regulatory risk on driver classification could raise costs in multiple regions.",
      "Robotaxis could disintermediate the marketplace if OEMs go direct.",
      "High beta name; rides and delivery both correlate with macro softness.",
    ],
  },
  LLY: {
    bull: [
      "GLP‑1 demand still far exceeds supply; capacity expansions drive near‑term upside.",
      "Pipeline optionality in obesity, Alzheimer’s, and oncology diversifies growth.",
      "Gross margins resilient even as volume scales — strong pricing umbrella.",
    ],
    bear: [
      "Compounding pharmacies and future GLP‑1 competitors could pressure pricing.",
      "Manufacturing is the bottleneck; any hiccup directly hits revenue cadence.",
      "Standard pharma risks: patent cliffs and reimbursement pushback.",
    ],
  },
  JNJ: {
    bull: [
      "AAA balance sheet and dividend growth make it a defensive compounder.",
      "MedTech plus pharma split post‑Kenvue simplifies the story and margins.",
      "Pipeline depth (100+ programs) gives multiple shots on goal through 2027.",
    ],
    bear: [
      "Talc litigation remains an overhang with uncertain ultimate cost.",
      "Key drug patent expirations loom later this decade.",
      "Lower growth profile could lag in a risk‑on tape relative to peers.",
    ],
  },
  ABBV: {
    bull: [
      "Skyrizi and Rinvoq are replacing Humira faster than expected with 50%+ growth.",
      "Aesthetics (Botox/Juvederm) provides consumer cash flow resilient to cycles.",
      "Cerevel deal broadens neuroscience and de‑risks pipeline concentration.",
    ],
    bear: [
      "Humira erosion still large; any stumble in Skyrizi/Rinvoq adoption hurts.",
      "High leverage vs peers leaves less room if rates stay elevated.",
      "Pipeline needs consistent wins to justify premium multiple post‑LOE.",
    ],
  },
  UNH: {
    bull: [
      "Largest US payer with unmatched data flywheel via Optum services.",
      "Diversified across insurance, care delivery, and PBM — resilient earnings mix.",
      "Aging population tailwind keeps member growth durable for years.",
    ],
    bear: [
      "MA reimbursement and policy risk can swing earnings each rate cycle.",
      "Cyberattack fallout increases near‑term costs and legal exposure.",
      "Political rhetoric on healthcare profits tends to cap valuation multiples.",
    ],
  },
  V: {
    bull: [
      "Cross-border volume recovery is high-margin fuel for EPS.",
      "Value-added services (risk, data, tokenization) diversify beyond core swipe fees.",
      "Cash-to-card shift globally still has a long runway, especially in emerging markets.",
    ],
    bear: [
      "Real-time payment rails and open banking threaten interchange economics.",
      "Regulatory cap on swipe fees could hit US profitability.",
      "Fintech upstarts (BNPL, wallets) keep pressuring take rates.",
    ],
  },
  COIN: {
    bull: [
      "ETF flows and institutional custody create durable fee streams beyond retail trading.",
      "Base L2 traction lowers on-chain costs and could open new revenue lines.",
      "US regulatory clarity would cement Coinbase as the compliant venue of choice.",
    ],
    bear: [
      "Revenue still highly correlated to crypto prices and volatility.",
      "International exchanges and Robinhood undercut fees and steal retail share.",
      "Regulatory actions (SEC cases) remain a swing factor until definitively resolved.",
    ],
  },
  SOFI: {
    bull: [
      "Bank charter gives cost-of-funds edge over most fintech peers.",
      "Member growth plus cross-sell keeps ARPU rising each quarter.",
      "Shift toward higher-quality personal loans improves credit profile.",
    ],
    bear: [
      "Margins thin; any credit deterioration hits profitability fast.",
      "Student loan volumes remain sensitive to policy and rate moves.",
      "Competes with megabanks and neobanks simultaneously — costly to win share.",
    ],
  },
  HOOD: {
    bull: [
      "Options and crypto activity drive surging transaction revenue in risk‑on markets.",
      "Gold subscription and retirement accounts add recurring, stickier revenue.",
      "New products (prediction markets, sports betting) expand the TAM meaningfully.",
    ],
    bear: [
      "Still reliant on PFOF/crypto volumes — volatile and policy sensitive.",
      "Regulatory scrutiny on PFOF or leverage could crimp core economics.",
      "Customer base is rate‑sensitive; churn rises in drawdowns.",
    ],
  },
  XYZ: { // Block / SQ
    bull: [
      "Cash App engagement and direct deposit adoption keep ARPU climbing.",
      "Square ecosystem benefits from omnichannel sellers and integrated payments + software.",
      "Bitcoin gross profit provides upside optionality in bull markets.",
    ],
    bear: [
      "Bitcoin exposure adds earnings noise and regulatory complexity.",
      "Competition in SMB acquiring (Toast, Clover, Stripe) is intense.",
      "Founder attention split raises governance and focus questions.",
    ],
  },
  TSLA: {
    bull: [
      "FSD/robotaxi optionality could dwarf hardware margins if autonomy lands.",
      "Energy storage deployments growing triple digits with healthy margins.",
      "Dojo/custom silicon aims to cut AI training costs and keep Tesla ahead.",
    ],
    bear: [
      "EV demand cooling and price cuts pressure automotive gross margins.",
      "BYD and other Chinese OEMs eroding share internationally.",
      "Brand risk from CEO controversies and regulatory probes (NHTSA, EU).",
    ],
  },
  RIVN: {
    bull: [
      "R1 platform gets rave reviews; high NPS in pickup/SUV segment.",
      "R2 and VW partnership extend cash runway and manufacturing expertise.",
      "Vertical integration (motors, batteries) could improve margins over time.",
    ],
    bear: [
      "Negative gross margins; profitability timeline still unclear.",
      "EV demand softness makes scaling volumes tougher in 2025.",
      "Capital needs could resurface if ramp slips or costs overrun.",
    ],
  },
  NEE: {
    bull: [
      "Largest renewable developer benefits directly from hyperscaler power demand.",
      "Regulated Florida utility arm keeps cash flows predictable.",
      "Balance sheet and scale give cost-of-capital edge in bidding for projects.",
    ],
    bear: [
      "Higher rates pressure utility valuations and project IRRs.",
      "Permitting/interconnection delays can slow growth cadence.",
      "Hurricane and weather risks always a factor for Florida operations.",
    ],
  },
  ENPH: {
    bull: [
      "Microinverter leadership in US residential solar remains strong.",
      "Storage attach rates rising; IQ Battery adds meaningful margin mix.",
      "International growth (EU/AU) offsets US demand softness.",
    ],
    bear: [
      "Residential solar volumes are rate‑sensitive and currently weak.",
      "SolarEdge and newcomers increase pricing pressure.",
      "Channel inventory corrections can whipsaw quarterly results.",
    ],
  },
  COST: {
    bull: [
      "93% renewal rate shows unmatched loyalty; membership fees drive profit.",
      "Ancillary growth (gas, e‑commerce, gold bars) adds incremental traffic.",
      "Recession‑resilient model with everyday low price moat.",
    ],
    bear: [
      "Trades at >50x earnings — premium leaves no room for comp slowdown.",
      "Any dip in renewal or membership growth would hit the thesis fast.",
      "Warehouse expansion is steady but not hypergrowth; valuation assumes more.",
    ],
  },
  WMT: {
    bull: [
      "Grocery dominance is defensive; share gains continue even in downturns.",
      "Walmart Connect ads and marketplace services lift margins above retail averages.",
      "Walmart+ membership deepens loyalty and data for targeting.",
    ],
    bear: [
      "35x earnings for low-margin retail is rich; execution must be flawless.",
      "Competes head-on with Amazon and Target for the same online basket.",
      "Any pullback in consumer spending flows straight to thin margins.",
    ],
  },
  NFLX: {
    bull: [
      "Password crackdown + ads restored double-digit subscriber and revenue growth.",
      "Ad tier has far higher margins and is early in its rollout.",
      "Global content amortization advantage widens versus regional streamers.",
    ],
    bear: [
      "Content spend remains massive; hit rate must stay high to justify it.",
      "Sports rights and live events raise cost structure and competitive heat.",
      "Valuation embeds continued sub growth; a miss would derate quickly.",
    ],
  },
  SBUX: {
    bull: [
      "New CEO Brian Niccol brings proven operational turnaround playbook.",
      "Loyalty program and app data enable pricing and throughput gains.",
      "China recovery plus store simplification can restore traffic growth.",
    ],
    bear: [
      "Turnaround execution risk — drive‑thru and mobile bottlenecks persist.",
      "Unionization and wage inflation pressure US store margins.",
      "China macro remains a swing factor for comps.",
    ],
  },
  NKE: {
    bull: [
      "Iconic athlete roster and innovation pipeline keep the brand relevant.",
      "Wholesale reset should clean up inventories and rebuild retailer goodwill.",
      "Paris Olympics visibility can reignite demand into FY25.",
    ],
    bear: [
      "Losing share to On and Hoka in the premium running segment.",
      "Growth stalled; valuation assumes a quick return to mid‑teens.",
      "Direct-to-consumer pivot whipsawed margins; strategy reset risk remains.",
    ],
  },
  SPOT: {
    bull: [
      "700M MAUs with improving gross margins after podcast cost cuts.",
      "Ad-supported + audiobooks bundles open new ARPU layers.",
      "Personalization moat strengthens with every stream — best discovery in audio.",
    ],
    bear: [
      "Licensing costs structurally high; labels keep most of the economics.",
      "Big tech rivals (Apple, YouTube) subsidize music to drive ecosystem lock-in.",
      "Premium price hikes could raise churn if consumer budgets tighten.",
    ],
  },
}

export function getBullBearPoints(stock, side) {
  const entry = STOCK_BULLETS[stock?.ticker]
  if (entry && Array.isArray(entry[side])) return entry[side]
  const val = stock?.[side]
  if (Array.isArray(val)) return val
  if (typeof val === 'string') {
    const parts = val.split(/\.\s+/).map((p) => p.trim()).filter(Boolean)
    if (parts.length >= 3) return parts.slice(0, 5)
    if (parts.length > 0) return parts
  }
  return ['No data yet.']
}

