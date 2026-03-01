<!--
Thank you for contributing to F1 Terminal.
As a quant platform, we require rigorous adherence to Data Science performance architectures.

Please fill out the form below.
-->

## Pull Request Synopsis
- **Title**: (e.g. `feat: implement mini-sector heatmaps on dominance widget`)
- **CLI Commands Added or Modified**: `DOM`

## Mathematical or Data Rationale
(Explain how your pull request extracts, slices, or interpolates the FastF1 `telemetry` DataFrame without introducing silent NaN errors)

## Quant Engineering Checklist
*Before assigning a reviewer, please confirm you have met our strict data requirements:*
- [ ] Has passed local `npm run lint` and TypeScript strict checks.
- [ ] No `any` types were used in data parsing payloads.
- [ ] The feature never directly iterates or maps multi-driver arrays without `scipy.interpolate` distance alignment.
- [ ] The visual module leverages ECharts LTTB (Largest Triangle Three Buckets) downsampling for massive data dumps.
- [ ] FastF1 Cache validation: Tested fetching against the local `./f1_cache` sqlite backend.

## Related Issues
Closes # (Issue ID, e.g., #1)
