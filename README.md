# VAB

A market-data research and VWAP screening tool built to explore price relationships around annual and rolling VWAP levels.

VAB started as a personal research project for testing and validating market signals. The project became an exercise in data processing, indicator methodology, validation, and building a usable browser-based research interface.

## What It Does

The public interface provides:

- Annual VWAP
- 365-day rolling VWAP
- Distance-to-VWAP percentages
- Spread-based filtering
- Recent daily-price charts
- A browser-based screening interface

The displayed date represents the latest daily bar in the dataset rather than a real-time market quote. Charts retain the most recent 250 daily bars, while indicators are calculated locally from the full downloaded history before being exported.

## Architecture

The public repository contains the static web interface and exported data snapshots.

The broader local workflow is:

```text
Market data
    ↓
Local data processing
    ↓
VWAP / screening calculations
    ↓
Python build process
    ↓
Static data export
    ↓
Browser interface / GitHub Pages
```

The private/local portion of the project includes the data connection workflow, Python runtime, and SQLite master database. Account credentials and connection details are intentionally not included in this public repository.

The public site is deployed through GitHub Pages from the `main` branch and does not require a server-side API.

## Why I Built It

While testing VWAP-based market signals, I found that calculated values could differ from values shown by other platforms.

Instead of assuming one output was correct, I began investigating the underlying methodology and data pipeline, including:

- Data-source differences
- Session definitions
- Historical boundaries
- Rolling-window behavior
- VWAP calculation methodology

That validation process became an important part of the project.

## Development Approach

I use AI-assisted development tools, including Codex, to accelerate implementation and debugging.

My role is to define the research question and expected behavior, design the workflow, test outputs, investigate inconsistencies, and iterate when results do not match expectations.

The project is therefore not intended to demonstrate a profitable trading strategy. It is primarily a software and data-research project built around a real problem I wanted to investigate.

## Current Limitations

This project is still under active development.

Known limitations include:

- Annual VWAP values have not yet been fully cross-validated against all reference sources.
- Rolling VWAP currently preserves the left-boundary behavior of the original Pine implementation.
- GEX analysis is not currently included.
- Strategy performance backtesting is not currently included.
- Data is not guaranteed to be complete, real-time, or error-free.

These limitations are documented intentionally so that unvalidated results are not presented as confirmed findings.

## Public vs. Private Components

This repository intentionally excludes:

- Account credentials
- Gateway connection details
- Local Python runtime components
- SQLite master database

Only the components required for the public interface and data snapshots are included.

## Related Project

I also built **Gem Lab**, a 3D gemstone identification simulator in Godot:

https://github.com/KOXUCHEN/GAME

## Disclaimer

VAB is a research and learning project. Nothing in this repository or its data constitutes investment advice. Users should independently verify all data and evaluate risk.

## Author

**KUAN-HSU CHEN**
