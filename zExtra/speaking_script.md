# SIH Presentation — Speaking Script (Technical Edition)
> Speak naturally. Technical terms are in [brackets] — drop them if the audience is non-technical.
> Each section flows into the next. Improvise around these ideas.

---

## 1. Opening — The Problem

"So imagine you are a government healthcare worker in Jharkhand or West Bengal,
and you need to explain something critical to a Santali-speaking patient —
a diagnosis, a dosage, an emergency instruction.
You speak Hindi. They speak Santali.
There is no translator available. What do you do?"

"This is not a hypothetical. This is the everyday reality for
8 million Santali speakers in India — one of the most spoken tribal languages
in the country, and yet almost completely invisible in the digital world."

"Santali is written in Ol Chiki script — a script invented specifically for this
language in 1925 by Pandit Raghunath Murmu.
It is not derived from Devanagari. It is not derived from Bengali.
It is its own independent script.
And because of that, Google Translate does not support it.
DeepL does not support it. There is no off-the-shelf solution."

---

## 2. Why We Chose This Problem

"We chose this because the gap is real and the stakes are high.
Language barriers in healthcare and education cost lives —
especially for tribal communities that are already underserved."

"Santali is recognized in the 8th Schedule of the Indian Constitution.
It deserves the same digital access that Hindi and English speakers take for granted.
We decided to build what did not exist."

---

## 3. First Attempt — IndicConformer and Why It Failed

"When we started, we thought this was a straightforward deep learning pipeline problem.
Find a pre-trained ASR model, plug in a translation model, ship it.
So we integrated IndicConformer —
a 200 million parameter Conformer-based speech recognition model
built by AI4Bharat, specifically designed for Indian language ASR."

"Why did we start there instead of just using Android's built-in tools? Three reasons:
First, accuracy. IndicConformer is the state-of-the-art for Indian languages. We assumed it would handle Indian accents and code-mixing better than anything else.
Second, the offline guarantee. We wanted a 100% self-contained app. Android's native ASR usually works offline, but sometimes it tries to hit the cloud or fails if the user hasn't downloaded the right language pack. Shipping our own model gave us absolute control.
And third, it is a hackathon. We wanted a pure, transparent AI pipeline, not a black-box operating system API."

[TECHNICAL: "Conformer is a hybrid architecture combining Convolutional Neural Networks
for local acoustic feature extraction with Transformer self-attention
for long-range sequence context. It outperforms pure Transformer ASR on short utterances."]

"It transcribed Hindi correctly. But on a budget 2GB RAM Android device,
the inference time was 10 to 11 seconds per utterance.
We were running a 200M parameter model on CPU with no hardware acceleration.
That is unusable for a real-time translator."

---

## 4. The ASR Fix — Android Native SpeechRecognizer

"The fix came from stepping back and asking — what is Android already running?

Every Android phone since version 10 ships with an on-device speech recognition engine.
It runs on the device's DSP — Digital Signal Processor — or NPU — Neural Processing Unit.
These are dedicated silicon chips optimized specifically for neural network inference.
They run the model in parallel with the CPU, with almost zero battery impact."

"We replaced IndicConformer with a single API call —
Android's native SpeechRecognizer with RECOGNIZE_SPEECH intent,
configured for Hindi locale: hi-IN.
The OS handles model loading, hardware acceleration, and inference transparently."

"Result: ASR latency dropped from 10,000 milliseconds to under 600 milliseconds.
That is a 17x improvement.
We did not train anything. We did not optimize anything.
We just used what was already there."

---

## 5. The Translation Model — IndicTrans2

"Now the harder problem: Hindi to Santali translation.
There is no API for this. No cloud service. No existing Android SDK.
We had to run a neural translation model entirely on the device."

"We chose IndicTrans2 — developed jointly by IIT Madras and AI4Bharat.
It is a sequence-to-sequence Transformer model trained on the Bharat Parallel Corpus,
covering 22 Indian language pairs.
Critically, it is one of the only openly available models that supports
the hin_Deva to sat_Olck language direction —
Hindi in Devanagari script to Santali in Ol Chiki script."

[TECHNICAL: "IndicTrans2 uses a shared multilingual encoder-decoder architecture.
The encoder tokenizes input using SentencePiece BPE — Byte-Pair Encoding —
with a vocabulary of 32,000 subword tokens shared across all 22 languages.
This lets the model handle code-switching and loanwords naturally.
The decoder autoregressively generates the target language token by token,
conditioned on the encoder's contextual embeddings."]

"The full model: 1.2 gigabytes. Our constraint: 100MB app, 2GB RAM phone.
We needed to shrink it and adapt it."

---

## 6. Fine-Tuning with LoRA — Aakansha's Work

"The base IndicTrans2 model has general multilingual capability,
but it needed specialization for our Hindi-Santali use case.
Our team member Aakansha handled this."

"First, the dataset.
We used FLORES-200 — Facebook's Flores benchmark dataset —
which contains professionally translated sentences in 200+ languages,
including Santali in Ol Chiki script.
That gave us roughly 1000 parallel sentence pairs.
We augmented it with template-generated sentences for domain-specific vocabulary —
school, healthcare, agriculture — bringing it to about 4000 pairs total."

"For fine-tuning, we used LoRA — Low-Rank Adaptation."

[TECHNICAL: "In a standard Transformer, the weight matrices in attention layers
are full-rank matrices — say 768 x 768. Full fine-tuning updates all of those.
LoRA instead freezes the original weights and injects two small low-rank matrices —
A with shape 768 x r, and B with shape r x 768 —
where r is the rank, typically 8 or 16.
The model learns the adaptation delta as B times A.
This reduces trainable parameters from hundreds of millions
to roughly 1 to 2 percent of the total."]

"We ran this on a Kaggle T4 GPU — free tier.
It took a few hours. Full retraining would have taken weeks and cost thousands of dollars."

---

## 7. Shrinking the Model — ONNX and INT8 Quantization

"After fine-tuning, the model still had a size problem.
Encoder: 479MB. Decoder: 807MB. Total: 1.28GB.

Step one was converting the model to ONNX format —
Open Neural Network Exchange.
ONNX is a universal model format that separates the model weights and computation graph
from the training framework. Once in ONNX format,
you can run it on Android using ONNX Runtime —
a lightweight inference engine that Microsoft open-sourced,
specifically designed for mobile and edge deployment.
No PyTorch. No Python. Just the model, running natively on Android."

"Step two was INT8 quantization.
The original weights are stored as float32 —
32-bit IEEE floating point numbers.
For each weight, we compute a scale factor and map the float range
to the integer range -128 to 127.
At runtime, ONNX Runtime dequantizes on the fly using fused kernel operations."

[TECHNICAL: "We used dynamic per-channel quantization — meaning the scale factor
is computed per output channel of each weight matrix rather than globally.
This preserves more precision in layers that have high dynamic range,
like the cross-attention keys and values, while still achieving 75% compression."]

"Encoder: 479MB down to 115MB.
Decoder: 807MB down to 194MB.
Total: 309MB. Within budget."

---

## 8. Staying Under RAM — Sequential Encoder-Decoder Loading

"Even at 309MB, loading both models into RAM simultaneously was not feasible.
A 2GB device has roughly 500MB to 700MB free after Android, kernel, and app overhead.
Loading both at once would OOM — Out Of Memory crash."

"Our solution: sequential loading via ONNX Runtime OrtSession lifecycle management.

We load the encoder OrtSession, run the forward pass on the tokenized Hindi input,
capture the encoder hidden state tensor, then explicitly call session.close()
and trigger the garbage collector to free that memory.
Then we load the decoder OrtSession, feed it the encoder output,
and run autoregressive token generation until the end-of-sequence token."

"Peak memory footprint at any point: approximately 200MB.
We stay within the device budget at every step."

---

## 9. The Phrase Cache — Three-Level Lookup

"The neural model is powerful but not instant.
For a real-world deployment — schools, clinics, field workers —
people say the same things repeatedly.
So we built a three-level translation lookup."

"Level 1: Exact cache hit.
All 4000 training sentence pairs are bundled in the APK as a JSON file,
loaded into a HashMap at app startup.
Input text is normalized — punctuation stripped, whitespace collapsed, lowercased —
and looked up directly. If found: translation returned in under 5 milliseconds.
No model. No inference. Zero latency."

"Level 2: Phrase substitution.
We maintain a manually curated list of 60 plus verb phrases and sentence patterns —
covering all grammatical conjugation variants of common verbs:
padh rahe hain, padh rahi hai, padh raha hoon, and so on.
The input is scanned for these substrings and replaced with verified Santali equivalents.
Remaining untranslated words are then mapped through a vocabulary dictionary.
This handles the vast majority of domain-specific sentences without touching the model."

"Level 3: Neural model fallback.
Only completely novel sentences that miss both Level 1 and Level 2
are passed to the quantized ONNX model.
This keeps median translation latency under 10 milliseconds for real-world use."

---

## 10. Challenges We Hit

"I want to be honest about the challenges."

"Challenge one: data scarcity.
FLORES-200 has about 1000 Santali sentence pairs.
That is orders of magnitude less than what commercial translation models train on.
For comparison, Google Translate trains on billions of sentence pairs per language.
We had 4000. The model reflects this."

"Challenge two: verb conjugation mismatch.
Hindi has complex verb conjugation — the same verb root changes form
based on subject gender, formality, and number.
Our template-generated training data incorrectly used masculine singular forms
for all subjects. So 'aap gana ga rahe hain' —
the grammatically correct formal form — was not in the training data.
We fixed this by manually adding all conjugation variants to the phrase map."

"Challenge three: decoder language tag.
ONNX Runtime requires the decoder to be initialized with a forced BOS token —
the beginning-of-sequence token — that signals the target language.
For Santali Ol Chiki, this is the sat_Olck language token.
An incorrect or missing forced BOS token causes the decoder to generate
output in the wrong language — typically Hindi or English echo.
This was a subtle bug that took time to diagnose."

---

## 11. Why This Approach — Every Decision Justified

"Why offline-first?
Santali-speaking communities are concentrated in rural Jharkhand, Odisha, and West Bengal —
areas with BSNL 2G coverage at best. A cloud API translator fails the moment
there is no signal. Every component in our pipeline runs on-device."

"Why Android native ASR instead of a custom model?
Google's on-device ASR for Hindi is already trained on millions of hours of audio
and runs on dedicated silicon. We cannot compete with that.
Using it gives us better accuracy at zero compute cost."

"Why IndicTrans2 specifically?
It is the only openly available model with a sat_Olck decode direction.
There is literally no other option that supports Santali in Ol Chiki script."

"Why ONNX Runtime instead of TensorFlow Lite or PyTorch Mobile?
ONNX Runtime has the best INT8 quantization support for encoder-decoder Transformers
on Android, and it is the export format that Hugging Face Optimum directly supports.
TFLite would have required a manual conversion with significant accuracy loss."

"Why LoRA instead of full fine-tuning?
A T4 GPU has 16GB VRAM. The 200M IndicTrans2 model in float32 is 800MB.
Full fine-tuning with a batch size large enough to be meaningful
would require 40 to 60GB VRAM minimum — a multi-GPU setup costing thousands per hour.
LoRA with rank 16 reduced our trainable parameter count to under 5 million.
We trained on a free Kaggle T4 in a few hours."

---

## 12. The Full Pipeline — What Happens When You Speak

"Here is exactly what happens when you tap the mic:

Step 1 — ASR: Android SpeechRecognizer captures audio and returns a Hindi string.
Latency: under 600ms. Runs on NPU/DSP.

Step 2 — Normalization: We strip punctuation, collapse whitespace, normalize Unicode.
This ensures consistent matching against the cache.

Step 3 — Cache lookup: HashMap get() on the normalized string.
If hit: done. Under 1 millisecond.

Step 4 — Phrase substitution: Scan for known verb phrases, substitute Santali equivalents.
Map remaining words through vocabulary dictionary.
If fully translated: done. Under 5 milliseconds.

Step 5 — ONNX inference: Tokenize with SentencePiece, run encoder OrtSession,
release encoder, run decoder OrtSession with sat_Olck BOS token,
autoregressive generation until EOS token, detokenize.
Latency: 2 to 8 seconds depending on device.

Step 6 — Display: Ol Chiki script rendered on screen using Unicode.
No special font required — Ol Chiki is part of Unicode since version 5.1."

---

## 13. What Is Next

"The next step is Text-to-Speech.
Meta's MMS-TTS — Massively Multilingual Speech — supports Santali natively.
It is a VITS-based architecture — Variational Inference with adversarial learning
for end-to-end Text-to-Speech.
Once integrated, the pipeline is complete: voice in, voice out.
You speak Hindi. The phone speaks Santali back."

"Longer term: more data.
We want to source from Jharkhand state government documents,
the Santali Wikipedia corpus, tribal publication archives,
and potentially collaborate with the Central Institute of Indian Languages."

"And with more data comes better neural model accuracy —
which reduces our dependence on the hand-curated phrase map
and makes the app handle truly open-domain conversation."

---

## 14. Closing

"We did not build a chatbot. We did not build a web app.
We built an entirely offline, on-device AI pipeline
that runs on the cheapest Android phone in a village with no internet —
and translates Hindi to a language that Google does not even support.

8 million people speak Santali.
They deserve a translator in their pocket.
That is what we built."

---

> KEY NUMBERS TO MEMORIZE:
> ASR: 10,000ms → 600ms (17x improvement)
> Model size: 1.28GB → 309MB (75% reduction via INT8 quantization)
> Cache hit translation: under 5ms
> Training cost: near zero (free Kaggle T4 + LoRA)
> Training data: ~4000 sentence pairs
> Target device: 2GB RAM, Android 9+
