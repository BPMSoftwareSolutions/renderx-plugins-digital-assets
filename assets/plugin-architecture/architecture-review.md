# Architecture Review: RenderX Plugins Demo (Thin Host)

## Overview
This repository acts as a thin host that boots the RenderX ecosystem and integrates external plugins (UI and Symphonic) via a manifest-driven approach. The host provides a small set of core services (SDK) and delegates most domain behavior to plugins.

## Core (Host SDK)
- Conductor: orchestrates startup and wiring between subsystems
- EventRouter: pub/sub over topics with replay cache for late subscribers
- Environment/Startup: loads configuration and plugin manifests/handlers
- Manifests: source-of-truth is plugin-generated manifests (not host-side copies)

## Microservices (Plugins)
- UI Plugins (e.g., canvas, library): provide panels, views, and UI handlers
- Symphonic Plugins (e.g., canvas-component, library-component): encapsulate domain flows and sequences (selection, component creation, drag)
- Handlers Export: plugins expose merged handlers (e.g., onDragStart, publishCreateRequested) and a handlersPath for the host to load

## Communication Model
- Routing: host uses manifest/handlersPath to register routes and topic subscriptions
- Topics Bus: EventRouter channels domain/UI events; topic replay cache supports state hydration
- Selection Symphony: selection drives control panel updates (avoid canvas.component.create-triggered updates)

## Data-Driven Configuration
- JSON-driven component library and control panel fields (from plugin-provided JSON)
- Component mapper and rule engine determine UI rendering and behavior without hard-coded lists
- Prefer plugin-served data; avoid host-side "fallback" JSON files

## Guardrails & Quality
- ESLint rules enforce architectural boundaries (no cross-plugin leakage; allow only SDK, manifest-tools, React)
- ADRs capture architectural decisions; link ADRs to GitHub issues
- Tests: unit (Vitest in plugin packages) + startup smoke/E2E in host to catch integration errors early

## Direction
- Progressive decoupling: externalize json-components to @renderx-plugins/components; keep host thin
- Auto-generate catalog/json-interactions from plugin-served data, not tracked in host

## Key Principles
1) Manifest-driven, not hard-coded
2) Selection-forwarded flows; avoid host-side routing/bridges when unnecessary
3) One source of truth for data; no host fallbacks
4) Keep the host minimal; push domain logic into plugins

