# Generative AI data demos

Four browser pages by [Par Bahrae](https://github.com/ParBproject). The live copy is at <https://parbproject.github.io/Generative-AI-Data/>.

## Pages

| Page | What it does |
| --- | --- |
| [Retail review sentiment](https://parbproject.github.io/Generative-AI-Data/retail_sentiment_demo.html) | DistilBERT SST-2 for sentiment, a small DeBERTa zero-shot model for six topic labels, and a DistilBART summary. The libraries download in the browser on the first analysis. |
| [Fraud scatter](https://parbproject.github.io/Generative-AI-Data/fraud_demo.html) | 1,000 uniform random points. A slider chooses how many are drawn in the 70–100 box on both axes and labeled fraud. |
| [Churn what-if](https://parbproject.github.io/Generative-AI-Data/churn_demo.html) | Probability from a fixed logistic: sigmoid(-4 - 0.05 × tenure + 0.04 × monthly charges). Sliders move the inputs. Those coefficients are constants in `js/demo-logic.js`, not a fit on customer data. |
| [Column summary](https://parbproject.github.io/Generative-AI-Data/automated_data_storytelling_demo.html) | Mean, minimum, and maximum of one numeric CSV column, with a histogram. The bundled sample is five rows (`SAMPLE_CSV`). A short list of example sentences is checked against those stats. |

## Run locally

Open `index.html` in a browser. The sentiment page fetches its library and models, so serve the folder if a `file://` URL blocks that request:

```bash
python3 -m http.server
```

## Tests

Node 22.14.0.

```bash
npm ci
npm test
```

`npm test` runs `node --test`. GitHub Actions checks out the repo with pinned actions, installs that Node version, runs `npm ci` from `package-lock.json`, then `npm test`. One test downloads the pinned Plotly and Transformers files and compares them with the hashes in `js/cdn.js`.

## Layout

```text
.
├── index.html
├── retail_sentiment_demo.html
├── fraud_demo.html
├── churn_demo.html
├── automated_data_storytelling_demo.html
├── js/
└── test/
```

## Data

Sentiment scores the text in the box. The fraud points are `Math.random()` draws (`FRAUD_TOTAL` is 1,000). The churn probability is the formula above. The storytelling sample is the five-row string in `js/demo-logic.js`.
