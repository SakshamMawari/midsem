import fs from "node:fs";
import path from "node:path";

interface PdfOptions {
  title: string;
  subtitle: string;
  unit: string;
  subject: string;
  sections: Array<{
    heading: string;
    items: string[];
  }>;
}

export function generatePdfBuffer(options: PdfOptions): Buffer {
  const { title, subtitle, unit, subject, sections } = options;

  let stream = "";
  // Header background bar
  stream += "0.08 0.08 0.1 rg\n";
  stream += "40 710 532 50 re f\n";

  // Header Title
  stream += "BT\n";
  stream += "/F2 16 Tf\n";
  stream += "1 1 1 rg\n";
  stream += "55 730 Td\n";
  stream += `(${escapePdf(title)}) Tj\n`;
  stream += "ET\n";

  // Subtitle / Breadcrumb
  stream += "BT\n";
  stream += "/F1 9 Tf\n";
  stream += "0.6 0.6 0.7 rg\n";
  stream += "55 718 Td\n";
  stream += `(${escapePdf(`${subject}  •  ${unit}  •  Study Notes`)}) Tj\n`;
  stream += "ET\n";

  // Subtitle text
  let y = 675;
  stream += "BT\n";
  stream += "/F1 11 Tf\n";
  stream += "0.2 0.2 0.25 rg\n";
  stream += `50 ${y} Td\n`;
  stream += `(${escapePdf(subtitle)}) Tj\n`;
  stream += "ET\n";

  // Line separator
  y -= 20;
  stream += "0.8 0.8 0.85 RG\n";
  stream += "1 w\n";
  stream += `50 ${y} m 562 ${y} l S\n`;

  y -= 30;

  for (const section of sections) {
    if (y < 100) break;
    // Section Heading
    stream += "BT\n";
    stream += "/F2 12 Tf\n";
    stream += "0.1 0.12 0.2 rg\n";
    stream += `50 ${y} Td\n`;
    stream += `(${escapePdf(section.heading)}) Tj\n`;
    stream += "ET\n";
    y -= 18;

    for (const item of section.items) {
      if (y < 80) break;
      stream += "BT\n";
      stream += "/F1 10 Tf\n";
      stream += "0.25 0.25 0.3 rg\n";
      stream += `65 ${y} Td\n`;
      stream += `(\\225  ${escapePdf(item)}) Tj\n`;
      stream += "ET\n";
      y -= 16;
    }
    y -= 14;
  }

  // Footer
  stream += "0.85 0.85 0.9 RG\n";
  stream += "0.5 w\n";
  stream += "50 50 m 562 50 l S\n";
  stream += "BT\n";
  stream += "/F1 8 Tf\n";
  stream += "0.5 0.5 0.6 rg\n";
  stream += "50 38 Td\n";
  stream += "(Digital Study Library  |  Page 1 of 1  |  All materials for academic study purposes.) Tj\n";
  stream += "ET\n";

  const streamBuf = Buffer.from(stream, "utf-8");

  const objects: string[] = [];
  objects[1] = "1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n";
  objects[2] = "2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n";
  objects[3] =
    "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R /F2 5 0 R >> >> /Contents 6 0 R >>\nendobj\n";
  objects[4] = "4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n";
  objects[5] = "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>\nendobj\n";
  objects[6] = `6 0 obj\n<< /Length ${streamBuf.length} >>\nstream\n${stream}\nendstream\nendobj\n`;

  let body = "%PDF-1.4\n%\xE2\xE3\xCF\xD3\n";
  const offsets: number[] = [0];

  for (let i = 1; i <= 6; i++) {
    offsets[i] = body.length;
    body += objects[i];
  }

  const xrefOffset = body.length;
  body += `xref\n0 7\n0000000000 65535 f \n`;
  for (let i = 1; i <= 6; i++) {
    body += `${String(offsets[i]).padStart(10, "0")} 00000 n \n`;
  }
  body += `trailer\n<< /Size 7 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;

  return Buffer.from(body, "utf-8");
}

function escapePdf(str: string): string {
  return str.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
}

async function main() {
  const root = process.cwd();
  const libraryDir = path.join(root, "public", "library");

  const samples = [
    {
      dir: path.join(libraryDir, "mds", "unit-1-fields-and-vector-spaces"),
      file: "01-fields-and-vector-spaces-lecture-notes.pdf",
      opts: {
        title: "Fields and Vector Spaces - Comprehensive Notes",
        subtitle: "Core algebraic axioms, field properties, and vector space definitions for data science.",
        unit: "Unit 1: Fields & Vector Spaces",
        subject: "Mathematics for Data Science",
        sections: [
          {
            heading: "1. Definition of a Field",
            items: [
              "A field F is a set equipped with addition and multiplication satisfying 9 core axioms.",
              "Associativity, commutativity, identity elements (0 and 1), and inverse elements.",
              "Distributivity of multiplication over addition: a * (b + c) = a*b + a*c."
            ]
          },
          {
            heading: "2. Vector Space Axioms over a Field",
            items: [
              "Vector addition closure: u + v is in V for all u, v in V.",
              "Scalar multiplication closure: c * v is in V for any scalar c in F and vector v in V.",
              "Additive identity: There exists a zero vector 0 such that v + 0 = v.",
              "Distributive laws: c(u + v) = cu + cv and (c + d)v = cv + dv."
            ]
          },
          {
            heading: "3. Examples and Applications in Machine Learning",
            items: [
              "Euclidean space R^n representing feature embeddings and sample points.",
              "Function spaces as infinite-dimensional vector spaces in Kernel methods.",
              "Dual spaces and linear functionals in support vector machine formulations."
            ]
          }
        ]
      }
    },
    {
      dir: path.join(libraryDir, "mds", "unit-1-fields-and-vector-spaces"),
      file: "02-vector-space-axioms-cheatsheet.pdf",
      opts: {
        title: "Vector Space Axioms & Quick Cheatsheet",
        subtitle: "Summary reference sheet for 8 vector space axioms with counter-examples.",
        unit: "Unit 1: Fields & Vector Spaces",
        subject: "Mathematics for Data Science",
        sections: [
          {
            heading: "Quick Axiom Checklist",
            items: [
              "Axiom 1-4: (V, +) is an abelian group with identity 0 and inverse -v.",
              "Axiom 5-8: Scalar multiplication is compatible with field multiplication and identity.",
              "1 * v = v for all v in V.",
              "c * (d * v) = (cd) * v for scalars c, d."
            ]
          },
          {
            heading: "Common Non-Vector Space Counter-Examples",
            items: [
              "Sets not containing the origin / zero vector.",
              "Integer coordinates Z^n over real scalars R (fails scalar closure).",
              "Upper-half plane R^2 with y >= 0 (fails additive inverse)."
            ]
          }
        ]
      }
    },
    {
      dir: path.join(libraryDir, "mds", "unit-2-subspaces"),
      file: "01-subspaces-and-linear-combinations.pdf",
      opts: {
        title: "Subspaces & Linear Combinations",
        subtitle: "The 3-point subspace criterion, linear combinations, and spans.",
        unit: "Unit 2: Subspaces",
        subject: "Mathematics for Data Science",
        sections: [
          {
            heading: "The Subspace Test (3-Point Criterion)",
            items: [
              "1. Non-empty subset: Contains the zero vector 0 in W.",
              "2. Closed under addition: If u, v in W, then u + v is in W.",
              "3. Closed under scalar multiplication: If v in W and c in F, then cv is in W."
            ]
          },
          {
            heading: "Linear Span & Column Space",
            items: [
              "Span(S) is the set of all linear combinations of elements in S.",
              "Span(S) is the smallest subspace of V containing S.",
              "The column space Col(A) is the span of matrix columns, representing image space."
            ]
          }
        ]
      }
    },
    {
      dir: path.join(libraryDir, "mds", "unit-3-linear-independence-basis-dimension"),
      file: "01-basis-and-dimension-theorems.pdf",
      opts: {
        title: "Linear Independence, Basis & Dimension",
        subtitle: "Fundamental definitions and proof outlines for vector space dimensions.",
        unit: "Unit 3: Linear Independence, Basis & Dimension",
        subject: "Mathematics for Data Science",
        sections: [
          {
            heading: "Linear Independence",
            items: [
              "Vectors v1,...,vk are linearly independent iff c1*v1 + ... + ck*vk = 0 implies all ci = 0.",
              "Any set of k > n vectors in an n-dimensional space is linearly dependent."
            ]
          },
          {
            heading: "Basis & Dimension",
            items: [
              "A basis B is a linearly independent spanning set of V.",
              "Every basis of a finite-dimensional space V has the exact same number of vectors (dim V).",
              "Rank-Nullity Theorem: dim(Null(A)) + dim(Col(A)) = number of columns."
            ]
          }
        ]
      }
    },
    {
      dir: path.join(libraryDir, "mds", "unit-4-projection-matrices"),
      file: "01-orthogonal-projections-and-least-squares.pdf",
      opts: {
        title: "Projection Matrices & Least Squares",
        subtitle: "Orthogonal projections, idempotent matrices, and regression applications.",
        unit: "Unit 4: Projection Matrices",
        subject: "Mathematics for Data Science",
        sections: [
          {
            heading: "Properties of Projection Matrices",
            items: [
              "Idempotency: P^2 = P.",
              "Orthogonal projection: P is symmetric (P^T = P), meaning P^T = P = P^2.",
              "Projection formula: P = A (A^T A)^(-1) A^T onto Col(A)."
            ]
          },
          {
            heading: "Ordinary Least Squares (OLS) Solution",
            items: [
              "Residual error vector e = b - Ax is orthogonal to Col(A): A^T(b - Ax) = 0.",
              "Normal Equations: (A^T A) x_hat = A^T b.",
              "Optimal projection b_hat = P * b minimizes squared Euclidean norm ||b - Ax||^2."
            ]
          }
        ]
      }
    },
    {
      dir: path.join(libraryDir, "mds", "unit-5-sets-sigma-algebras-monotone-classes"),
      file: "01-sigma-algebras-and-measure-theory-foundations.pdf",
      opts: {
        title: "Sigma Algebras & Monotone Classes",
        subtitle: "Measure-theoretic probability foundations for continuous random variables.",
        unit: "Unit 5: Sets, Sigma-Algebras & Monotone Classes",
        subject: "Mathematics for Data Science",
        sections: [
          {
            heading: "Sigma-Algebra Definition",
            items: [
              "A collection F of subsets of Omega containing the sample space Omega.",
              "Closed under complementation: If A in F, then A^c is in F.",
              "Closed under countable unions: If A1, A2, ... in F, then union(Ai) is in F."
            ]
          },
          {
            heading: "Borel Sigma-Algebra & Probability Space",
            items: [
              "Borel sigma-algebra B(R) generated by open intervals (a, b).",
              "Probability space triplet (Omega, F, P) with Kolmogorov axioms.",
              "Monotone Class Theorem for extending uniqueness of probability measures."
            ]
          }
        ]
      }
    },
    {
      dir: path.join(libraryDir, "image-processing", "unit-1-image-fundamentals"),
      file: "01-image-fundamentals-and-sampling.pdf",
      opts: {
        title: "Digital Image Fundamentals & Sampling",
        subtitle: "Visual perception, light, electromagnetic spectrum, sampling and quantization.",
        unit: "Unit 1: Digital Image Fundamentals",
        subject: "Image Processing",
        sections: [
          {
            heading: "1. Elements of Visual Perception & Image Formation",
            items: [
              "Structure of human eye: cones (photopic vision) and rods (scotopic vision).",
              "Light spectrum: visible wavelength range 400nm (violet) to 700nm (red).",
              "Image acquisition pipeline: sensors, illumination source, and digital conversion."
            ]
          },
          {
            heading: "2. Image Sampling and Quantization",
            items: [
              "Spatial resolution: number of pixels per unit length (sampling density).",
              "Intensity resolution: number of discrete intensity levels (2^k bits per pixel).",
              "Aliasing and Nyquist-Shannon sampling theorem in 2D spatial frequencies."
            ]
          }
        ]
      }
    },
    {
      dir: path.join(libraryDir, "image-processing", "unit-2-image-enhancement-filtering"),
      file: "01-spatial-filtering-and-enhancement.pdf",
      opts: {
        title: "Spatial Filtering & Image Enhancement",
        subtitle: "Histogram equalization, smoothing filters, sharpening filters, and gradient operators.",
        unit: "Unit 2: Enhancement & Filtering",
        subject: "Image Processing",
        sections: [
          {
            heading: "1. Intensity Transformation & Histogram Processing",
            items: [
              "Logarithmic and power-law (Gamma) transformations for contrast adjustment.",
              "Histogram equalization: transformation function s = T(r) producing uniform PDF.",
              "Local histogram statistics for adaptive image enhancement."
            ]
          },
          {
            heading: "2. Spatial Filters",
            items: [
              "Smoothing spatial filters: box filter and Gaussian lowpass smoothing kernels.",
              "Sharpening filters: Laplacian second-derivative operator for edge highlighting.",
              "Unsharp masking and high-boost filtering for edge detail preservation."
            ]
          }
        ]
      }
    },
    {
      dir: path.join(libraryDir, "image-processing", "unit-3-morphological-processing"),
      file: "01-morphological-operations-and-segmentation.pdf",
      opts: {
        title: "Morphological Image Processing & Segmentation",
        subtitle: "Erosion, dilation, opening, closing, hit-or-miss transform, and boundary detection.",
        unit: "Unit 3: Morphological Processing",
        subject: "Image Processing",
        sections: [
          {
            heading: "1. Basic Morphological Operations",
            items: [
              "Structuring elements: shape, size, and origin definition.",
              "Erosion: shrinking binary image objects according to structuring element.",
              "Dilation: expanding boundaries and bridging small spatial gaps.",
              "Opening (erosion followed by dilation) and Closing (dilation followed by erosion)."
            ]
          },
          {
            heading: "2. Morphological Algorithms",
            items: [
              "Boundary extraction: difference between original set and eroded set.",
              "Hole filling: conditional dilation based on complement mask.",
              "Connected components labeling for region segmentation."
            ]
          }
        ]
      }
    },
    {
      dir: path.join(libraryDir, "pc-python", "unit-1-python-programming"),
      file: "01-python-data-structures-and-numpy.pdf",
      opts: {
        title: "Python Data Structures & NumPy Scientific Computing",
        subtitle: "Python data structures, functional primitives, ndarray operations, and broadcasting.",
        unit: "Unit 1: Python Programming",
        subject: "Python",
        sections: [
          {
            heading: "1. Core Python Data Structures & Paradigms",
            items: [
              "Lists, tuples, dictionaries, and sets: time complexity and usage patterns.",
              "List/dict comprehensions and generator expressions for memory efficiency.",
              "Lambda functions, map, filter, zip, and functools.reduce in data processing."
            ]
          },
          {
            heading: "2. NumPy Numerical Computing",
            items: [
              "N-dimensional array (ndarray) creation, striding, slicing, and memory views.",
              "Broadcasting rules: shape compatibility across singleton dimensions.",
              "Vectorized operations, linear algebra (np.linalg), and eigenvalue decomposition."
            ]
          }
        ]
      }
    },
    {
      dir: path.join(libraryDir, "pc-python", "unit-2-technical-communication"),
      file: "01-pandas-data-analysis-and-visualization.pdf",
      opts: {
        title: "Pandas Data Analysis & Matplotlib Visualization",
        subtitle: "DataFrame operations, group-by aggregations, time series, and plotting.",
        unit: "Unit 2: Data Analysis & Visualization",
        subject: "Python",
        sections: [
          {
            heading: "1. Pandas Data Wrangling",
            items: [
              "Series and DataFrame indexing: loc vs iloc label/integer positional access.",
              "Handling missing values: isna, fillna, dropna, and interpolation strategies.",
              "Split-Apply-Combine paradigm with groupby and custom aggregation functions."
            ]
          },
          {
            heading: "2. Visualization with Matplotlib & Seaborn",
            items: [
              "Figure and Axes object-oriented interface in Matplotlib.",
              "Plotting statistical distributions: histograms, KDE plots, and boxplots.",
              "Exporting publication-ready vector charts and heatmaps with colorbars."
            ]
          }
        ]
      }
    },
    {
      dir: path.join(libraryDir, "ml", "unit-1-supervised-learning"),
      file: "01-linear-and-logistic-regression.pdf",
      opts: {
        title: "Supervised Learning: Regression & Classification",
        subtitle: "Loss functions, gradient descent optimization, and cross-entropy loss.",
        unit: "Unit 1: Supervised Learning",
        subject: "Machine Learning",
        sections: [
          {
            heading: "1. Empirical Risk Minimization",
            items: [
              "Hypothesis class h_theta(x) mapping input vectors to predictions.",
              "Mean Squared Error (MSE) loss for regression: L(y, y_hat) = 1/2 * (y - y_hat)^2.",
              "Binary cross-entropy loss for classification: -y log(p) - (1 - y) log(1 - p)."
            ]
          },
          {
            heading: "2. Gradient Descent Optimization",
            items: [
              "Parameter update: theta := theta - alpha * grad_theta(J(theta)).",
              "Stochastic Gradient Descent (SGD) and mini-batch variance reduction.",
              "L1 Lasso and L2 Ridge regularization for controlling overfitting."
            ]
          }
        ]
      }
    },
    {
      dir: path.join(libraryDir, "ml", "unit-2-neural-networks-and-deep-learning"),
      file: "01-feedforward-neural-networks-backpropagation.pdf",
      opts: {
        title: "Feedforward Neural Networks & Backpropagation",
        subtitle: "Perceptrons, multi-layer networks, activation functions, and computational graphs.",
        unit: "Unit 2: Neural Networks & Deep Learning",
        subject: "Machine Learning",
        sections: [
          {
            heading: "1. Architecture & Activation Functions",
            items: [
              "Multilayer Perceptron (MLP) with hidden layers and universal approximation theorem.",
              "Activation functions: Sigmoid, Hyperbolic Tangent (Tanh), and ReLU.",
              "Addressing vanishing and exploding gradients with initialization schemes."
            ]
          },
          {
            heading: "2. Backpropagation Algorithm",
            items: [
              "Forward pass: computing layer activations and intermediate cache values.",
              "Reverse automatic differentiation using the multivariate chain rule.",
              "Weight update optimization: Momentum, RMSProp, and Adam optimizers."
            ]
          }
        ]
      }
    }
  ];

  for (const sample of samples) {
    await fs.promises.mkdir(sample.dir, { recursive: true });
    const target = path.join(sample.dir, sample.file);
    const pdfBuf = generatePdfBuffer(sample.opts);
    await fs.promises.writeFile(target, pdfBuf);
    console.log(`Generated: ${path.relative(root, target)} (${pdfBuf.length} bytes)`);
  }
}

if (process.argv[1] && process.argv[1].endsWith("create-sample-pdfs.ts")) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
