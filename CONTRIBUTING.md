# Contributing to F1 Terminal

We treat `F1 Terminal` as a mission-critical financial and engineering tool. Code pushed to this repository must be robust, decoupled, and mathematically sound.

## 1. Commit Name Discipline (Conventional Commits)

You **MUST** format your pull request titles and commit messages strictly using Conventional Commits. No exceptions:
- `feat: add DOM mini-sector partition calculation to dominance_service`
- `fix: scipy interpolation dimension mismatch returning NaN on Delta`
- `refactor: extract ECharts tooltip formatting to utility module`
- `docs: update CLI command matrix in README`
- `perf: downsample React grid layout width computation`

## 2. The Data Engineering Iron Laws

If you are modifying anything within the `/backend` FastAPI architecture or relying on `FastF1`, you are bound by these quantitative rules:

### Rule 2.1: Never use Time as an X-Axis for comparisons
F1 cars complete laps at different speeds. You **CANNOT** compare Driver A and Driver B by syncing their raw array indices or Time traces.
* **Requirement:** You must always establish a synthetic `ref_distance` array (e.g., `np.arange(0, max_dist, 2)`). You then use `scipy.interpolate.interp1d` to remap Both Driver's `Time` properties against this reference distance before subtracting them to find $\Delta T$.

### Rule 2.2: Compute first, downsample later
If you perform mathematical integrations (like mapping RPM and Throttle to find theoretical acceleration limits), you must run your logic against the **original, highest-frequency unpadded data**. Do not slice, compress, or round arrays until the absolute last step before transmitting the JSON payload to the Next.js frontend.

### Rule 2.3: Zero Tolerance for Silent Failures
Due to GPS dropouts and sensor lags, FastF1 telemetry frequently returns `NaN` in acceleration maps or track space coords. 
* **Requirement:** Your API routes will instantly fail to serialize if `NaN` hits the JSON parser. You must pipe all data frames through `polars` / `pandas` `.drop_nulls()` or explicitly `.fill_nan(0)` based on context.

## 3. Bug Reports & Feature Requests

Do not submit empty, vague issues like "Chart doesn't load."  
- Always prepend the **CLI Sequence** that triggered the pipeline failure (e.g., `[COMMAND] TEL 2024 BAH Q VER`).
- Extract the specific terminal traceback from `uvicorn`.

When proposing a new Quant Feature:
- Include the mathematical formula required. Don't just say "add tyre deg curve". Show the regression equation you expect the backend to solve. Provide racing engineering references if available.
