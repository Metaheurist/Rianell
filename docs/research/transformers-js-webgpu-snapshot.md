[![Hugging Face's logo](https://huggingface.co/front/assets/huggingface_logo-noborder.svg)Hugging Face](https://huggingface.co/)

- [Models](https://huggingface.co/models)
- [Datasets](https://huggingface.co/datasets)
- [Spaces](https://huggingface.co/spaces)
- [Buckets new](https://huggingface.co/storage)
- [Docs](https://huggingface.co/docs)
- [Enterprise](https://huggingface.co/enterprise)
- [Pricing](https://huggingface.co/pricing)
- - Website

    - [Tasks](https://huggingface.co/tasks)
    - [HuggingChat](https://huggingface.co/chat)
    - [Collections](https://huggingface.co/collections)
    - [Languages](https://huggingface.co/languages)
    - [Organizations](https://huggingface.co/organizations)
  - Community

    - [Blog](https://huggingface.co/blog)
    - [Posts](https://huggingface.co/posts)
    - [Daily Papers](https://huggingface.co/papers)
    - [Learn](https://huggingface.co/learn)
    - [Discord](https://huggingface.co/join/discord)
    - [Forum](https://discuss.huggingface.co/)
    - [GitHub](https://github.com/huggingface)
  - Solutions

    - [Team & Enterprise](https://huggingface.co/enterprise)
    - [Hugging Face PRO](https://huggingface.co/pro)
    - [Enterprise Support](https://huggingface.co/support)
    - [Inference Providers](https://huggingface.co/inference/models)
    - [Inference Endpoints](https://huggingface.co/inference-endpoints)
    - [Storage Buckets](https://huggingface.co/storage)

- * * *

- [Log In](https://huggingface.co/login)
- [Sign Up](https://huggingface.co/join)

Transformers.js documentation

Running models on WebGPU

# Transformers.js

🏡 View all docsAWS Trainium & InferentiaAccelerateArgillaAutoTrainBitsandbytesCLIChat UIDataset viewerDatasetsDeploying on AWSDiffusersDistilabelEvaluateGoogle CloudGoogle TPUsGradioHubHub Python LibraryHuggingface.jsInference Endpoints (dedicated)Inference ProvidersKernelsLeRobotLeaderboardsLightevalMicrosoft AzureOpenEnvOptimumPEFTReachy MiniSafetensorsSentence TransformersTRLTasksText Embeddings InferenceText Generation InferenceTokenizersTrackioTransformersTransformers.jsXetsmolagentstimm

Search documentation

mainv3.8.1v3.0.0v2.17.2.DS\_STOREEN

[🤗 Transformers.js](https://huggingface.co/docs/transformers.js/v3.8.1/index)

Get started

[Installation](https://huggingface.co/docs/transformers.js/v3.8.1/installation) [The pipeline API](https://huggingface.co/docs/transformers.js/v3.8.1/pipelines) [Custom usage](https://huggingface.co/docs/transformers.js/v3.8.1/custom_usage)

Tutorials

[Building a Vanilla JS Application](https://huggingface.co/docs/transformers.js/v3.8.1/tutorials/vanilla-js) [Building a React Application](https://huggingface.co/docs/transformers.js/v3.8.1/tutorials/react) [Building a Next.js Application](https://huggingface.co/docs/transformers.js/v3.8.1/tutorials/next) [Building a Browser Extension](https://huggingface.co/docs/transformers.js/v3.8.1/tutorials/browser-extension) [Building an Electron Application](https://huggingface.co/docs/transformers.js/v3.8.1/tutorials/electron) [Server-side Inference in Node.js](https://huggingface.co/docs/transformers.js/v3.8.1/tutorials/node)

Developer Guides

[Running models on WebGPU](https://huggingface.co/docs/transformers.js/v3.8.1/guides/webgpu) [Using quantized models (dtypes)](https://huggingface.co/docs/transformers.js/v3.8.1/guides/dtypes) [Accessing Private/Gated Models](https://huggingface.co/docs/transformers.js/v3.8.1/guides/private) [Server-side Audio Processing](https://huggingface.co/docs/transformers.js/v3.8.1/guides/node-audio-processing)

API Reference

[Index](https://huggingface.co/docs/transformers.js/v3.8.1/api/transformers) [Pipelines](https://huggingface.co/docs/transformers.js/v3.8.1/api/pipelines) [Models](https://huggingface.co/docs/transformers.js/v3.8.1/api/models) [Tokenizers](https://huggingface.co/docs/transformers.js/v3.8.1/api/tokenizers) [Processors](https://huggingface.co/docs/transformers.js/v3.8.1/api/processors) [Configs](https://huggingface.co/docs/transformers.js/v3.8.1/api/configs) [Environment variables](https://huggingface.co/docs/transformers.js/v3.8.1/api/env)

Backends

Generation

Utilities

![Hugging Face's logo](https://huggingface.co/front/assets/huggingface_logo-noborder.svg)

Join the Hugging Face community

and get access to the augmented documentation experience

Collaborate on models, datasets and Spaces

Faster examples with accelerated inference

Switch between documentation themes

[Sign Up](https://huggingface.co/join)

to get started

Copy page

# Running models on WebGPU

WebGPU is a new web standard for accelerated graphics and compute. The [API](https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API) enables web developers to use the underlying system’s GPU to carry out high-performance computations directly in the browser. WebGPU is the successor to [WebGL](https://developer.mozilla.org/en-US/docs/Web/API/WebGL_API) and provides significantly better performance, because it allows for more direct interaction with modern GPUs. Lastly, it supports general-purpose GPU computations, which makes it just perfect for machine learning!

> As of October 2024, global WebGPU support is around 70% (according to [caniuse.com](https://caniuse.com/webgpu)), meaning some users may not be able to use the API.
>
> If the following demos do not work in your browser, you may need to enable it using a feature flag:
>
> - Firefox: with the `dom.webgpu.enabled` flag (see [here](https://developer.mozilla.org/en-US/docs/Mozilla/Firefox/Experimental_features#:~:text=tested%20by%20Firefox.-,WebGPU%20API,-The%20WebGPU%20API)).
> - Safari: with the `WebGPU` feature flag (see [here](https://webkit.org/blog/14879/webgpu-now-available-for-testing-in-safari-technology-preview/)).
> - Older Chromium browsers (on Windows, macOS, Linux): with the `enable-unsafe-webgpu` flag (see [here](https://developer.chrome.com/docs/web-platform/webgpu/troubleshooting-tips)).

## Usage in Transformers.js v3

Thanks to our collaboration with [ONNX Runtime Web](https://www.npmjs.com/package/onnxruntime-web), enabling WebGPU acceleration is as simple as setting `device: 'webgpu'` when loading a model. Let’s see some examples!

**Example:** Compute text embeddings on WebGPU ( [demo](https://v2.scrimba.com/s06a2smeej))

Copied

```
import { pipeline } from "@huggingface/transformers";

// Create a feature-extraction pipeline
const extractor = await pipeline(
  "feature-extraction",
  "mixedbread-ai/mxbai-embed-xsmall-v1",
  { device: "webgpu" },
);

// Compute embeddings
const texts = ["Hello world!", "This is an example sentence."];
const embeddings = await extractor(texts, { pooling: "mean", normalize: true });
console.log(embeddings.tolist());
// [\
//   [-0.016986183822155, 0.03228696808218956, -0.0013630966423079371, ... ],\
//   [0.09050482511520386, 0.07207386940717697, 0.05762749910354614, ... ],\
// ]
```

**Example:** Perform automatic speech recognition with OpenAI whisper on WebGPU ( [demo](https://v2.scrimba.com/s0oi76h82g))

Copied

```
import { pipeline } from "@huggingface/transformers";

// Create automatic speech recognition pipeline
const transcriber = await pipeline(
  "automatic-speech-recognition",
  "onnx-community/whisper-tiny.en",
  { device: "webgpu" },
);

// Transcribe audio from a URL
const url = "https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/jfk.wav";
const output = await transcriber(url);
console.log(output);
// { text: ' And so my fellow Americans ask not what your country can do for you, ask what you can do for your country.' }
```

**Example:** Perform image classification with MobileNetV4 on WebGPU ( [demo](https://v2.scrimba.com/s0fv2uab1t))

Copied

```
import { pipeline } from "@huggingface/transformers";

// Create image classification pipeline
const classifier = await pipeline(
  "image-classification",
  "onnx-community/mobilenetv4_conv_small.e2400_r224_in1k",
  { device: "webgpu" },
);

// Classify an image from a URL
const url = "https://huggingface.co/datasets/Xenova/transformers.js-docs/resolve/main/tiger.jpg";
const output = await classifier(url);
console.log(output);
// [\
//   { label: 'tiger, Panthera tigris', score: 0.6149784922599792 },\
//   { label: 'tiger cat', score: 0.30281734466552734 },\
//   { label: 'tabby, tabby cat', score: 0.0019135422771796584 },\
//   { label: 'lynx, catamount', score: 0.0012161266058683395 },\
//   { label: 'Egyptian cat', score: 0.0011465961579233408 }\
// ]
```

## Reporting bugs and providing feedback

Due to the experimental nature of WebGPU, especially in non-Chromium browsers, you may experience issues when trying to run a model (even it it can run in WASM). If you do, please open [an issue on GitHub](https://github.com/huggingface/transformers.js/issues/new?title=%5BWebGPU%5D%20Error%20running%20MODEL_GOES_HERE&assignees=&labels=bug,webgpu&projects=&template=1_bug-report.yml) and we’ll do our best to address it. Thanks!

[Update on GitHub](https://github.com/huggingface/transformers.js/blob/main/docs/source/guides/webgpu.md)

[←Server-side Inference in Node.js](https://huggingface.co/docs/transformers.js/v3.8.1/tutorials/node) [Using quantized models (dtypes)→](https://huggingface.co/docs/transformers.js/v3.8.1/guides/dtypes)

[Running models on WebGPU](https://huggingface.co/docs/transformers.js/v3.8.1/guides/webgpu#running-models-on-webgpu) [Usage in Transformers.js v3](https://huggingface.co/docs/transformers.js/v3.8.1/guides/webgpu#usage-in-transformersjs-v3) [Reporting bugs and providing feedback](https://huggingface.co/docs/transformers.js/v3.8.1/guides/webgpu#reporting-bugs-and-providing-feedback)