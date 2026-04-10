/**
 * Mock seed script — inserts 10 realistic AI/ML papers + cards into Neon.
 * Use when arXiv API is rate-limiting: `npm run seed:mock`
 */

import { db } from "../src/lib/db/index";
import { papers, cards, citations } from "../src/lib/db/schema";
import { inArray, sql } from "drizzle-orm";

interface MockPaper {
  id: string;
  title: string;
  abstract: string;
  authors: string[];
  categories: string[];
  publishedAt: string;
  pdfUrl: string;
  arxivUrl: string;
}

interface MockCard {
  paperId: string;
  headline: string;
  hook: string;
  body: string;
  tldr: string;
  tags: string[];
  readingTimeSeconds: number;
  replicationStatus: string;
  eli5Summary: string;
}

// Citation pairs: [citing paperId, cited paperId]
const CITATION_PAIRS: [string, string][] = [
  ["2310.06825", "mock-2403.00007"], // ScaleFormer → TokenPruner (efficiency)
  ["2310.06825", "2309.10305"],      // ScaleFormer → Constitutional AI (scale + alignment)
  ["2309.10305", "mock-2403.00009"], // Constitutional AI → SafeGuard (safety)
  ["2309.10305", "2303.08774"],      // Constitutional AI → ReasonTrace (alignment + reasoning)
  ["2303.08774", "mock-2403.00010"], // ReasonTrace → GraphRAG (multi-hop reasoning)
  ["2302.13971", "mock-2403.00008"], // DiffusionPolicy → WorldSim (robotics)
  ["2301.07041", "mock-2403.00008"], // FlowMatch → WorldSim (generative video)
  ["2308.09687", "mock-2403.00007"], // NeuroPDE → TokenPruner (efficient inference)
  ["mock-2403.00010", "2310.06825"], // GraphRAG → ScaleFormer (LLM backbone)
];

const MOCK_PAPERS: MockPaper[] = [
  {
    id: "2310.06825",
    title: "ScaleFormer: Scaling Transformer Architectures Beyond 1 Trillion Parameters via Mixture-of-Experts Routing",
    abstract: "We present ScaleFormer, a novel architecture that extends the Mixture-of-Experts (MoE) paradigm to enable stable training of language models beyond 1 trillion parameters. Our approach introduces adaptive load-balancing through a learned routing mechanism that dynamically assigns tokens to expert sub-networks, eliminating the expert collapse problem observed in prior work. We train a 1.2T parameter model on 4.5 trillion tokens and demonstrate that ScaleFormer achieves state-of-the-art perplexity on standard benchmarks while requiring only 18% of the FLOPs of a dense model of equivalent capacity.",
    authors: ["Yuki Tanaka", "Priya Sharma", "Marcus Hoffmann", "Li Wei", "Elena Petrov"],
    categories: ["cs.CL", "cs.LG"],
    publishedAt: "2026-03-20T00:00:00Z",
    pdfUrl: "https://arxiv.org/pdf/2310.06825",
    arxivUrl: "https://arxiv.org/abs/2310.06825",
  },
  {
    id: "2302.13971",
    title: "DiffusionPolicy++: Hierarchical Diffusion Models for Long-Horizon Robot Manipulation",
    abstract: "We introduce DiffusionPolicy++, a hierarchical framework that decouples high-level subgoal planning from low-level action generation through a two-stage diffusion process. On the FurnitureBench and RoboSuite long-horizon suites, our method outperforms prior state-of-the-art by 31% in task completion rate.",
    authors: ["Aisha Nkosi", "Dmitri Volkov", "Soo-Jin Park", "Rafael Mendez"],
    categories: ["cs.RO", "cs.LG"],
    publishedAt: "2026-03-21T00:00:00Z",
    pdfUrl: "https://arxiv.org/pdf/2302.13971",
    arxivUrl: "https://arxiv.org/abs/2302.13971",
  },
  {
    id: "2309.10305",
    title: "Constitutional AI at Scale: Empirical Analysis of Value Alignment Under Distribution Shift",
    abstract: "We conduct a systematic study of CAI-trained models across 47 out-of-distribution evaluation sets. We propose Constitutional Robustness Training (CRT), reducing value drift by 62% on worst-case OOD benchmarks without degrading helpfulness.",
    authors: ["Hannah Osei", "James Kirchner", "Mei-Ling Zhou", "Arjun Kapoor"],
    categories: ["cs.AI", "cs.CL"],
    publishedAt: "2026-03-21T00:00:00Z",
    pdfUrl: "https://arxiv.org/pdf/2309.10305",
    arxivUrl: "https://arxiv.org/abs/2309.10305",
  },
  {
    id: "2301.07041",
    title: "FlowMatch: Rectified Flow for One-Step Text-to-Image Synthesis",
    abstract: "We propose FlowMatch, which frames generation as a rectified flow between noise and data distributions. A single neural function evaluation generates 1024×1024 images in 47 ms on a single A100 GPU, matching the FID score of a 25-step DDPM baseline.",
    authors: ["Sofia Lindqvist", "Kenji Mori", "Fatima Al-Rashid", "Tom Braun"],
    categories: ["cs.CV", "cs.LG"],
    publishedAt: "2026-03-22T00:00:00Z",
    pdfUrl: "https://arxiv.org/pdf/2301.07041",
    arxivUrl: "https://arxiv.org/abs/2301.07041",
  },
  {
    id: "2303.08774",
    title: "Reasoning Without Shortcuts: Evaluating Chain-of-Thought Faithfulness in Large Language Models",
    abstract: "We introduce ReasonTrace, a benchmark of 8,400 problems spanning mathematics, logic, and causal reasoning. Our analysis of ten frontier models reveals that visible CoT traces are faithful roughly 71% of the time on average.",
    authors: ["Oluwaseun Adeyemi", "Claire Rousseau", "Takeshi Nakamura", "Ingrid Bergström"],
    categories: ["cs.CL", "cs.AI"],
    publishedAt: "2026-03-22T00:00:00Z",
    pdfUrl: "https://arxiv.org/pdf/2303.08774",
    arxivUrl: "https://arxiv.org/abs/2303.08774",
  },
  {
    id: "2308.09687",
    title: "NeuroPDE: Physics-Informed Neural Operators for Partial Differential Equations at Planetary Scale",
    abstract: "NeuroPDE introduces a physics-informed Fourier neural operator that encodes conservation laws as hard constraints. On ERA5 atmospheric reanalysis data, NeuroPDE achieves 3-day forecasts competitive with IFS operational models at 0.25° resolution while running 3,400× faster.",
    authors: ["Lena Fischer", "Siddharth Rao", "Yolanda Obi", "Pierre Dubois"],
    categories: ["cs.LG", "physics.ao-ph"],
    publishedAt: "2026-03-23T00:00:00Z",
    pdfUrl: "https://arxiv.org/pdf/2308.09687",
    arxivUrl: "https://arxiv.org/abs/2308.09687",
  },
  {
    id: "mock-2403.00007",
    title: "TokenPruner: Dynamic Context Compression for Efficient Long-Context Inference",
    abstract: "TokenPruner is a training-free dynamic compression method that identifies and removes uninformative tokens from the KV cache during inference. On 128k-token contexts, TokenPruner reduces KV cache memory by 68% and cuts time-to-first-token by 41% with less than 1% degradation.",
    authors: ["Akosua Mensah", "Vladislav Petersen", "Min-Jun Lee", "Giulia Romano"],
    categories: ["cs.CL", "cs.LG"],
    publishedAt: "2026-03-24T00:00:00Z",
    pdfUrl: "https://arxiv.org/pdf/mock-2403.00007",
    arxivUrl: "https://arxiv.org/abs/mock-2403.00007",
  },
  {
    id: "mock-2403.00008",
    title: "WorldSim: Scalable World Models for Embodied Agent Pre-Training",
    abstract: "WorldSim is a scalable world model trained on 50 billion video frames. Agents pre-trained with WorldSim-generated data achieve 2.4× higher success rate on zero-shot household task benchmarks compared to agents trained with simulation alone.",
    authors: ["Amara Diallo", "Benjamin Schreiber", "Na-Rae Han", "Carlos Vega"],
    categories: ["cs.CV", "cs.RO", "cs.AI"],
    publishedAt: "2026-03-25T00:00:00Z",
    pdfUrl: "https://arxiv.org/pdf/mock-2403.00008",
    arxivUrl: "https://arxiv.org/abs/mock-2403.00008",
  },
  {
    id: "mock-2403.00009",
    title: "SafeGuard: Real-Time Jailbreak Detection via Latent Space Anomaly Scoring",
    abstract: "SafeGuard is a lightweight detection module that operates on hidden-state activations to identify jailbreak attempts before generation begins. On JailbreakBench and HarmBench, SafeGuard achieves 94.7% detection accuracy with a 0.8% false positive rate, adding only 1.2 ms latency.",
    authors: ["Chioma Eze", "Lars Eriksson", "Haruto Yamamoto", "Priscilla Santos"],
    categories: ["cs.CR", "cs.CL", "cs.AI"],
    publishedAt: "2026-03-26T00:00:00Z",
    pdfUrl: "https://arxiv.org/pdf/mock-2403.00009",
    arxivUrl: "https://arxiv.org/abs/mock-2403.00009",
  },
  {
    id: "mock-2403.00010",
    title: "GraphRAG: Knowledge Graph-Augmented Retrieval for Multi-Hop Question Answering",
    abstract: "GraphRAG augments the retrieval pipeline with a dynamically constructed knowledge graph. On MuSiQue and HotpotQA benchmarks, GraphRAG improves exact match scores by 18.3 and 14.1 points respectively, and reduces hallucination rates by 27%.",
    authors: ["Blessing Okonkwo", "Henrik Andersen", "Sakura Fujimoto", "Diego Herrera"],
    categories: ["cs.IR", "cs.CL"],
    publishedAt: "2026-03-27T00:00:00Z",
    pdfUrl: "https://arxiv.org/pdf/mock-2403.00010",
    arxivUrl: "https://arxiv.org/abs/mock-2403.00010",
  },
];

const MOCK_CARDS: MockCard[] = [
  {
    paperId: "2310.06825",
    headline: "A 1.2 trillion parameter AI that costs 82% less to run",
    hook: "What if you could build the world's most powerful AI model and only pay for a fraction of the compute?",
    body: "Researchers cracked the code on training trillion-parameter models efficiently. The trick: Mixture-of-Experts (MoE), where instead of using the full model for every word, the AI dynamically routes each token to only the most relevant specialist sub-networks.\n\nPrevious MoE models had a fatal flaw—experts would collapse. ScaleFormer fixes this with a learned router that keeps workload balanced automatically.\n\nThe result? A 1.2T parameter model that needs only 18% of the compute of a comparably capable dense model.",
    tldr: "New router design lets a 1.2T-parameter model run at 18% the compute cost of dense models, hitting SOTA benchmarks.",
    tags: ["llms", "mixture-of-experts", "scaling", "efficiency"],
    readingTimeSeconds: 60,
    replicationStatus: "preprint",
    eli5Summary: "Imagine a team where instead of everyone doing every job, each person only does what they're best at. This AI works the same way—it sends each word to just the right 'expert' brain, making a giant AI as cheap to run as a tiny one.",
  },
  {
    paperId: "2302.13971",
    headline: "Robots that plan like humans and move like dancers",
    hook: "Teaching a robot to assemble furniture is one of AI's hardest problems. This team just made it look easy.",
    body: "Most robot AI is limited to short, scripted tasks. The moment you need a robot to spend 5 minutes assembling an IKEA shelf, existing systems fall apart.\n\nDiffusionPolicy++ solves this with a two-tier brain. A high-level planner produces meaningful waypoints from language instructions, while a low-level controller generates precise, smooth joint movements between them.\n\nResults: 31% more tasks completed than prior state-of-the-art on furniture and tabletop benchmarks.",
    tldr: "Two-stage diffusion model enables multi-minute robot manipulation, beating prior SOTA by 31% on complex benchmarks.",
    tags: ["robotics", "diffusion-models", "manipulation", "planning"],
    readingTimeSeconds: 55,
    replicationStatus: "peer_reviewed",
    eli5Summary: "Teaching a robot to make dinner is like teaching a kid to follow a 50-step recipe. This research lets the robot first decide on the big cooking stages, then figure out exactly how to do each tiny move.",
  },
  {
    paperId: "2309.10305",
    headline: "AI alignment breaks down when cultures clash—here's the fix",
    hook: "An AI trained to be helpful and harmless in one culture can behave very differently in another. Scientists just proved it.",
    body: "Constitutional AI is one of the leading techniques for making AI models behave well. But it works great only on inputs the model was trained on.\n\nThis team ran the most comprehensive stress test of CAI to date: 47 out-of-distribution datasets covering adversarial attacks, cultural context shifts, and novel instructions. Value drift was most pronounced when a user's cultural background conflicted with the training constitution.\n\nTheir fix, Constitutional Robustness Training, exposes models to a diverse library of constitutions during training, reducing value drift by 62%.",
    tldr: "CAI models drift from their values on OOD inputs; training with a diverse constitution library reduces drift by 62%.",
    tags: ["alignment", "safety", "constitutional-ai", "llms"],
    readingTimeSeconds: 65,
    replicationStatus: "replicated",
    eli5Summary: "Imagine teaching a kid to be polite using a rulebook from one country. If they visit another country with different customs, they might accidentally be rude. This research fixes AI the same way—it learns from many different rulebooks at once.",
  },
  {
    paperId: "2301.07041",
    headline: "One-step AI image generation—no waiting, no compromise",
    hook: "Generating a 1024×1024 image in 47 milliseconds sounds impossible. FlowMatch just made it real.",
    body: "Stable Diffusion needs 20–50 steps to refine noise into an image. Researchers have been racing to collapse this to a single step without sacrificing quality.\n\nFlowMatch reimagines the problem as a 'flow' between pure noise and the final image. By training the model to follow perfectly straight paths between the two, one forward pass is enough.\n\nThe 1B-parameter model produces 1024px images in 47 ms on a single GPU, matching a 25-step diffusion baseline in quality.",
    tldr: "Rectified flow training enables single-step 1024px generation at 47 ms while matching multi-step diffusion quality.",
    tags: ["diffusion-models", "image-generation", "efficiency", "flow-matching"],
    readingTimeSeconds: 50,
    replicationStatus: "preprint",
    eli5Summary: "Normal AI image-making is like developing a photo by adding one chemical layer at a time—25 steps. FlowMatch learns to go straight from blank film to finished photo in a single step.",
  },
  {
    paperId: "2303.08774",
    headline: "When AI 'shows its work', is it actually telling the truth?",
    hook: "Chain-of-thought reasoning made AI smarter. But a new benchmark reveals it's making up its steps nearly 30% of the time.",
    body: "Getting AI to 'think out loud'—chain-of-thought prompting—is one of the most powerful tricks in modern AI. But whether those visible reasoning steps are faithful to the model's actual computation is debated.\n\nReasonTrace is an 8,400-problem benchmark designed to catch this. It checks whether perturbing an intermediate step changes the final answer appropriately.\n\nThe verdict: frontier models are faithful about 71% of the time. Under pressure they shortcut, and sometimes produce confident but causally disconnected reasoning.",
    tldr: "New benchmark finds frontier LLMs have faithful chain-of-thought only ~71% of the time, with shortcuts emerging under adversarial conditions.",
    tags: ["reasoning", "llms", "interpretability", "chain-of-thought"],
    readingTimeSeconds: 70,
    replicationStatus: "peer_reviewed",
    eli5Summary: "When AI 'shows its work' on a math problem, you'd think the steps lead to the answer. But this research caught frontier models producing confident step-by-step reasoning that has nothing to do with how they actually got the answer—nearly 30% of the time.",
  },
  {
    paperId: "2308.09687",
    headline: "AI that predicts the weather at planetary scale—3,400× faster than physics",
    hook: "Running a global weather simulation at fine resolution takes supercomputers weeks. NeuroPDE does it in seconds.",
    body: "The gold standard in weather forecasting—ECMWF's IFS—simulates the atmosphere by numerically solving PDEs. It works but takes enormous compute and can't easily scale.\n\nNeuroPDE is a physics-informed neural operator: it learns to approximate these PDE solutions but is hard-constrained to conserve mass, momentum, and energy—something prior neural weather models ignored.\n\nTrained on 40 years of ERA5 data, NeuroPDE matches IFS skill on 3-day forecasts at 0.25° resolution and runs 3,400× faster. It also generalises to climate scenarios not in training data.",
    tldr: "Physics-constrained neural operator matches operational weather forecast accuracy at 0.25° resolution, running 3,400× faster at inference.",
    tags: ["neural-operators", "climate", "physics-ml", "forecasting"],
    readingTimeSeconds: 60,
    replicationStatus: "peer_reviewed",
    eli5Summary: "Weather forecasts normally need giant supercomputers running for hours. This AI learned to do the same forecast 3,400 times faster by understanding the basic rules of physics instead of brute-forcing the numbers.",
  },
  {
    paperId: "mock-2403.00007",
    headline: "Cut your LLM's memory use by 68%—no retraining required",
    hook: "Long-context AI is expensive. A new plug-in method slashes memory costs without touching the model weights.",
    body: "Reading a 100,000-word document with an LLM means storing a massive 'KV cache'. This cache is the main bottleneck for long-context deployment.\n\nTokenPruner is a training-free add-on that scores every token for its likely relevance and evicts the least useful ones on the fly. The scoring combines attention entropy, gradient magnitude, and inter-layer coherence.\n\nOn 128k-token tasks, TokenPruner cuts KV cache memory by 68% and time-to-first-token by 41% with under 1% quality loss. It works on any transformer and stacks with existing tricks like grouped-query attention.",
    tldr: "Training-free KV cache pruning cuts memory 68% and latency 41% on 128k-context tasks with <1% quality degradation.",
    tags: ["llms", "efficiency", "long-context", "inference"],
    readingTimeSeconds: 55,
    replicationStatus: "preprint",
    eli5Summary: "Reading a very long book normally means keeping every page in memory. TokenPruner figures out which pages you're done with and throws them away as you read, using 68% less memory with almost no loss in understanding.",
  },
  {
    paperId: "mock-2403.00008",
    headline: "The AI that simulates reality so robots can train inside it",
    hook: "What if an AI could imagine any physical environment so vividly that a robot could learn real skills inside the simulation?",
    body: "Collecting real-world robot interaction data is slow, expensive, and sometimes dangerous. Game engines help, but they look fake and lack realistic physics.\n\nWorldSim is trained on 50 billion video frames with matched action annotations. Given a starting frame and an action sequence, it generates photorealistic video of what would happen next—complete with collisions, deformations, and lighting changes.\n\nRobots pre-trained using WorldSim rollouts score 2.4× higher on zero-shot household tasks than those trained in conventional simulators.",
    tldr: "World model trained on 50B video frames enables photorealistic robot training rollouts; downstream policies score 2.4× higher zero-shot.",
    tags: ["world-models", "robotics", "embodied-ai", "video-generation"],
    readingTimeSeconds: 65,
    replicationStatus: "preprint",
    eli5Summary: "Instead of letting a robot bumble around learning from real-life mistakes, WorldSim makes an incredibly realistic video-game world for it to practice in first—so the robot arrives in reality already knowing what to do.",
  },
  {
    paperId: "mock-2403.00009",
    headline: "Catching jailbreaks before the AI even starts talking",
    hook: "Jailbreaks still slip past the world's safest AI models. A new detection method stops them in under 2 milliseconds.",
    body: "No matter how carefully an AI is aligned, creative adversarial prompts can unlock harmful behaviour. Current defences often classify outputs after generation—by which point the damage is done.\n\nSafeGuard is different: it reads the AI's internal activations at the input stage, before a single word is generated. It learns what 'safe' inputs look like in latent space, then flags anything outside that region.\n\nOn two major jailbreak benchmarks, SafeGuard detected 94.7% of attacks with only 0.8% false positives, adding just 1.2 ms of latency.",
    tldr: "Latent-space anomaly detector identifies jailbreaks before generation with 94.7% accuracy, 0.8% false positives, 1.2 ms overhead.",
    tags: ["ai-safety", "jailbreaks", "red-teaming", "alignment"],
    readingTimeSeconds: 55,
    replicationStatus: "disputed",
    eli5Summary: "Some clever questions can trick AI into saying dangerous things. SafeGuard is like a bouncer who reads the vibe of a question before the AI even hears it—stopping 95% of bad questions at the door.",
  },
  {
    paperId: "mock-2403.00010",
    headline: "RAG that actually reasons—no more one-hop limitations",
    hook: "Standard AI search can answer 'who wrote Hamlet?' but falls apart on multi-step questions. GraphRAG fixes this.",
    body: "Retrieval-augmented generation struggles with multi-hop questions that require synthesising information across multiple documents.\n\nGraphRAG adds a knowledge graph layer. As documents are indexed, entities and their relationships are extracted and stored as a graph. At query time, the system traverses this graph to assemble multi-hop evidence chains, then feeds them to the LLM.\n\nOn MuSiQue and HotpotQA, GraphRAG improved exact match scores by 18.3 and 14.1 points over BM25 RAG baselines, with hallucination rates down 27%.",
    tldr: "Knowledge graph retrieval layer lifts multi-hop QA exact match by up to 18 points and cuts hallucinations by 27%.",
    tags: ["rag", "knowledge-graphs", "question-answering", "llms"],
    readingTimeSeconds: 70,
    replicationStatus: "replicated",
    eli5Summary: "Answering a complex question often needs connecting facts from many different places. GraphRAG builds a map connecting all the facts first, so it can follow the trail from clue to clue like a detective—instead of guessing.",
  },
];

async function main() {
  console.log("Seeding mock papers, cards, and citations...\n");

  // ── 1. Insert papers ────────────────────────────────────────────────────────
  for (const paper of MOCK_PAPERS) {
    await db.insert(papers).values(paper).onConflictDoNothing({ target: papers.id });
    console.log(`  ✓ paper: ${paper.id} — ${paper.title.slice(0, 55)}…`);
  }

  // ── 2. Insert cards ─────────────────────────────────────────────────────────
  for (const card of MOCK_CARDS) {
    await db.insert(cards).values(card).onConflictDoNothing();
    console.log(`  ✓ card:  ${card.paperId} — ${card.headline.slice(0, 50)}…`);
  }

  // ── 3. Build paperId → cardId map ───────────────────────────────────────────
  const paperIds = MOCK_PAPERS.map((p) => p.id);
  const insertedCards = await db
    .select({ id: cards.id, paperId: cards.paperId })
    .from(cards)
    .where(inArray(cards.paperId, paperIds));

  const cardByPaper = new Map<string, string>();
  for (const row of insertedCards) {
    cardByPaper.set(row.paperId, row.id);
  }

  // ── 4. Insert citations ─────────────────────────────────────────────────────
  console.log("\n  Inserting citations…");
  let citationsInserted = 0;
  for (const [citingPaperId, citedPaperId] of CITATION_PAIRS) {
    const citingCardId = cardByPaper.get(citingPaperId);
    const citedCardId = cardByPaper.get(citedPaperId);
    if (!citingCardId || !citedCardId) {
      console.warn(`  ⚠ missing card for pair ${citingPaperId} → ${citedPaperId}`);
      continue;
    }
    await db
      .insert(citations)
      .values({ citingCardId, citedCardId })
      .onConflictDoNothing();
    citationsInserted++;
  }
  console.log(`  ✓ ${citationsInserted} citation relationships`);

  // ── 5. Summary ──────────────────────────────────────────────────────────────
  const [paperCount, cardCount] = await Promise.all([
    db.execute(sql`SELECT COUNT(*) FROM papers`),
    db.execute(sql`SELECT COUNT(*) FROM cards`),
  ]);

  console.log(`\nDone.`);
  console.log(`  DB totals: ${paperCount.rows[0].count} papers, ${cardCount.rows[0].count} cards, ${citationsInserted} citations`);

  // ── SQL to fix existing seeded records in Neon ──────────────────────────────
  // Run this in the Neon SQL editor if you seeded before the ID fix.
  // Because paper_id in cards is a FK, we insert new row, re-point cards, delete old.
  console.log(`
-- ============================================================
-- Run in Neon SQL editor to update existing mock paper records
-- ============================================================
BEGIN;

-- 2403.00001 → 2310.06825
INSERT INTO papers SELECT '2310.06825',title,abstract,authors,categories,published_at,'https://arxiv.org/pdf/2310.06825','https://arxiv.org/abs/2310.06825',created_at FROM papers WHERE id='mock-2403.00001' ON CONFLICT DO NOTHING;
UPDATE cards SET paper_id='2310.06825' WHERE paper_id='mock-2403.00001';
DELETE FROM papers WHERE id='mock-2403.00001';

-- 2403.00002 → 2302.13971
INSERT INTO papers SELECT '2302.13971',title,abstract,authors,categories,published_at,'https://arxiv.org/pdf/2302.13971','https://arxiv.org/abs/2302.13971',created_at FROM papers WHERE id='mock-2403.00002' ON CONFLICT DO NOTHING;
UPDATE cards SET paper_id='2302.13971' WHERE paper_id='mock-2403.00002';
DELETE FROM papers WHERE id='mock-2403.00002';

-- 2403.00003 → 2309.10305
INSERT INTO papers SELECT '2309.10305',title,abstract,authors,categories,published_at,'https://arxiv.org/pdf/2309.10305','https://arxiv.org/abs/2309.10305',created_at FROM papers WHERE id='mock-2403.00003' ON CONFLICT DO NOTHING;
UPDATE cards SET paper_id='2309.10305' WHERE paper_id='mock-2403.00003';
DELETE FROM papers WHERE id='mock-2403.00003';

-- 2403.00004 → 2301.07041
INSERT INTO papers SELECT '2301.07041',title,abstract,authors,categories,published_at,'https://arxiv.org/pdf/2301.07041','https://arxiv.org/abs/2301.07041',created_at FROM papers WHERE id='mock-2403.00004' ON CONFLICT DO NOTHING;
UPDATE cards SET paper_id='2301.07041' WHERE paper_id='mock-2403.00004';
DELETE FROM papers WHERE id='mock-2403.00004';

-- 2403.00005 → 2303.08774
INSERT INTO papers SELECT '2303.08774',title,abstract,authors,categories,published_at,'https://arxiv.org/pdf/2303.08774','https://arxiv.org/abs/2303.08774',created_at FROM papers WHERE id='mock-2403.00005' ON CONFLICT DO NOTHING;
UPDATE cards SET paper_id='2303.08774' WHERE paper_id='mock-2403.00005';
DELETE FROM papers WHERE id='mock-2403.00005';

-- 2403.00006 → 2308.09687
INSERT INTO papers SELECT '2308.09687',title,abstract,authors,categories,published_at,'https://arxiv.org/pdf/2308.09687','https://arxiv.org/abs/2308.09687',created_at FROM papers WHERE id='mock-2403.00006' ON CONFLICT DO NOTHING;
UPDATE cards SET paper_id='2308.09687' WHERE paper_id='mock-2403.00006';
DELETE FROM papers WHERE id='mock-2403.00006';

COMMIT;
-- ============================================================
`);

  process.exit(0);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
