# Graph Report - .  (2026-05-27)

## Corpus Check
- Corpus is ~42,300 words - fits in a single context window. You may not need a graph.

## Summary
- 671 nodes · 912 edges · 75 communities (46 shown, 29 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 41 edges (avg confidence: 0.85)
- Token cost: 25,000 input · 4,300 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Navigation & Auth UI|Navigation & Auth UI]]
- [[_COMMUNITY_NPM Runtime Dependencies|NPM Runtime Dependencies]]
- [[_COMMUNITY_Course & Calendar Data|Course & Calendar Data]]
- [[_COMMUNITY_Sidebar & Input Primitives|Sidebar & Input Primitives]]
- [[_COMMUNITY_App Architecture & Config|App Architecture & Config]]
- [[_COMMUNITY_Dev Toolchain|Dev Toolchain]]
- [[_COMMUNITY_Toast State Machine|Toast State Machine]]
- [[_COMMUNITY_Database Schema & RLS|Database Schema & RLS]]
- [[_COMMUNITY_Form & Overlay Primitives|Form & Overlay Primitives]]
- [[_COMMUNITY_Utility & Button Primitives|Utility & Button Primitives]]
- [[_COMMUNITY_TypeScript App Config|TypeScript App Config]]
- [[_COMMUNITY_shadcnui Component Config|shadcn/ui Component Config]]
- [[_COMMUNITY_Form Components|Form Components]]
- [[_COMMUNITY_TypeScript Node Config|TypeScript Node Config]]
- [[_COMMUNITY_Carousel Component|Carousel Component]]
- [[_COMMUNITY_Menubar Component|Menubar Component]]
- [[_COMMUNITY_Chart Components|Chart Components]]
- [[_COMMUNITY_Dropdown Menu|Dropdown Menu]]
- [[_COMMUNITY_Context Menu|Context Menu]]
- [[_COMMUNITY_TypeScript Base Config|TypeScript Base Config]]
- [[_COMMUNITY_TS Project References|TS Project References]]
- [[_COMMUNITY_Alert Dialog|Alert Dialog]]
- [[_COMMUNITY_Sheet Overlay|Sheet Overlay]]
- [[_COMMUNITY_Data Table|Data Table]]
- [[_COMMUNITY_Toggle Group|Toggle Group]]
- [[_COMMUNITY_shadcn Wrapper Concepts|shadcn Wrapper Concepts]]
- [[_COMMUNITY_Breadcrumb Navigation|Breadcrumb Navigation]]
- [[_COMMUNITY_Navigation Menu|Navigation Menu]]
- [[_COMMUNITY_Drawer Overlay|Drawer Overlay]]
- [[_COMMUNITY_Card Component|Card Component]]
- [[_COMMUNITY_OpenSpec Workflow|OpenSpec Workflow]]
- [[_COMMUNITY_OTP Input|OTP Input]]
- [[_COMMUNITY_Alert Component|Alert Component]]
- [[_COMMUNITY_OpenSpec Skills|OpenSpec Skills]]
- [[_COMMUNITY_Avatar Component|Avatar Component]]
- [[_COMMUNITY_Accordion Component|Accordion Component]]
- [[_COMMUNITY_Badge Component|Badge Component]]
- [[_COMMUNITY_Claude Permissions|Claude Permissions]]
- [[_COMMUNITY_Radio Group|Radio Group]]
- [[_COMMUNITY_Textarea Input|Textarea Input]]
- [[_COMMUNITY_Alert Dialog Overlay|Alert Dialog Overlay]]
- [[_COMMUNITY_Path Aliases|Path Aliases]]
- [[_COMMUNITY_OpenSpec Config|OpenSpec Config]]
- [[_COMMUNITY_Navigation Viewport|Navigation Viewport]]
- [[_COMMUNITY_Scroll Area|Scroll Area]]
- [[_COMMUNITY_Toaster Component|Toaster Component]]
- [[_COMMUNITY_Vitest Configuration|Vitest Configuration]]
- [[_COMMUNITY_Tabs List|Tabs List]]
- [[_COMMUNITY_Tabs Trigger|Tabs Trigger]]
- [[_COMMUNITY_Tabs Content|Tabs Content]]
- [[_COMMUNITY_Card Family|Card Family]]
- [[_COMMUNITY_Popover Content|Popover Content]]
- [[_COMMUNITY_Pagination|Pagination]]
- [[_COMMUNITY_OTP Input Concept|OTP Input Concept]]
- [[_COMMUNITY_OTP Slot Concept|OTP Slot Concept]]
- [[_COMMUNITY_Hover Card Content|Hover Card Content]]
- [[_COMMUNITY_Accordion Concept|Accordion Concept]]
- [[_COMMUNITY_Tooltip Content|Tooltip Content]]
- [[_COMMUNITY_Radio Group Concept|Radio Group Concept]]
- [[_COMMUNITY_Form Concept|Form Concept]]
- [[_COMMUNITY_Collapsible Concept|Collapsible Concept]]
- [[_COMMUNITY_Dropdown Menu Concept|Dropdown Menu Concept]]
- [[_COMMUNITY_Context Menu Concept|Context Menu Concept]]
- [[_COMMUNITY_Test Suite|Test Suite]]
- [[_COMMUNITY_Test Setup|Test Setup]]
- [[_COMMUNITY_DB Schema Migration|DB Schema Migration]]

## God Nodes (most connected - your core abstractions)
1. `cn()` - 71 edges
2. `compilerOptions` - 19 edges
3. `epicode-tracker package` - 15 edges
4. `compilerOptions` - 14 edges
5. `supabase` - 14 edges
6. `useAuth()` - 14 edges
7. `Index()` - 10 edges
8. `CLAUDE.md project guidance` - 10 edges
9. `courseColor()` - 9 edges
10. `scripts` - 8 edges

## Surprising Connections (you probably didn't know these)
- `useTheme context hook` --semantically_similar_to--> `next-themes`  [INFERRED] [semantically similar]
  .claude/CLAUDE.md → package.json
- `RPC: get_shared_courses, get_shared_calendar` --references--> `@supabase/supabase-js`  [INFERRED]
  .claude/CLAUDE.md → package.json
- `Tailwind CSS config` --rationale_for--> `Editorial Design System`  [INFERRED]
  tailwind.config.ts → .claude/CLAUDE.md
- `Index()` --conceptually_related_to--> `RLS per-user isolation pattern`  [INFERRED]
  src/pages/Index.tsx → supabase/migrations/20260420090438_ec7658c0-3967-434e-8cf5-71670e4b5d0a.sql
- `Auth()` --conceptually_related_to--> `RLS per-user isolation pattern`  [INFERRED]
  src/pages/Auth.tsx → supabase/migrations/20260420090438_ec7658c0-3967-434e-8cf5-71670e4b5d0a.sql

## Hyperedges (group relationships)
- **shadcn/ui component stack** — components_json, tailwind_config, package_radix_ui, package_class_variance_authority, package_tailwind_merge [INFERRED 0.90]
- **Form validation stack** — package_react_hook_form, package_zod, package_radix_ui [INFERRED 0.85]
- **OpenSpec OPSX command suite** — opsx_explore_md, opsx_propose_md, opsx_apply_md, opsx_archive_md [EXTRACTED 1.00]
- **OpenSpec propose-explore-archive workflow trio** — openspec_propose_skill, openspec_explore_skill, openspec_archive_change_skill [INFERRED 0.90]
- **App root provider stack (QueryClient+Theme+Auth)** — src_app_app, src_app_queryclient, src_app_protected [EXTRACTED 1.00]
- **AppNavbar composed of NavLink and ThemeToggle** — components_appnavbar_appnavbar, components_navlink_navlink, components_themetoggle_themetoggle [EXTRACTED 1.00]
- **Overlay+Portal+Content pattern shared by Dialog, Sheet, Drawer** — ui_dialog_dialogcontent, ui_sheet_sheetcontent, ui_drawer_drawercontent [INFERRED 0.85]
- **ChartTooltipContent and ChartLegendContent both consume ChartContext via useChart** — ui_chart_charttooltipcontent, ui_chart_chartlegendcontent, ui_chart_usechart [EXTRACTED 1.00]
- **CommandDialog composes Command inside Dialog+DialogContent** — ui_command_commanddialog, ui_dialog_dialog, ui_dialog_dialogcontent [EXTRACTED 1.00]
- **React Context Provider Pattern** — hooks_useauth_authprovider, hooks_useauth_useauth, hooks_useauth_authcontext [EXTRACTED 1.00]
- **Theme Context Provider Pattern** — hooks_usetheme_themeprovider, hooks_usetheme_usetheme, hooks_usetheme_themecontext [EXTRACTED 1.00]
- **Toast Notification System** — ui_toast_toast, hooks_use_toast_usetoast, hooks_use_toast_toast_fn [INFERRED 0.95]
- **Share token access pattern: share_tokens + get_shared_courses + get_shared_calendar enable anonymous read access to user data** — supabase_types_table_share_tokens, supabase_types_fn_get_shared_courses, supabase_types_fn_get_shared_calendar, pages_shared_shared [EXTRACTED 0.95]
- **courseColor exported from Index and consumed by Calendar, Shared** — pages_index_coursecolor, pages_calendar_calendar, pages_shared_shared [EXTRACTED 1.00]
- **All tables use RLS per-user isolation pattern** — supabase_types_table_courses, supabase_types_table_calendar_entries, supabase_types_table_calendar_todos, supabase_types_table_share_tokens [EXTRACTED 0.95]

## Communities (75 total, 29 thin omitted)

### Community 0 - "Navigation & Auth UI"
Cohesion: 0.06
Nodes (41): AppNavbar(), AppNavbarProps, NavLink, NavLinkCompatProps, options, ThemeToggle(), Auth Session Management, AppNavbar actions slot pattern (+33 more)

### Community 1 - "NPM Runtime Dependencies"
Cohesion: 0.04
Nodes (54): dependencies, class-variance-authority, clsx, cmdk, date-fns, @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities (+46 more)

### Community 2 - "Course & Calendar Data"
Cohesion: 0.06
Nodes (49): Realtime course sync pattern, Share Token Management, useShare(), CalView, Course, Entry, Kind, KIND_META (+41 more)

### Community 3 - "Sidebar & Input Primitives"
Cohesion: 0.07
Nodes (33): useIsMobile(), Button, Input, Separator, Sidebar, SidebarContent, SidebarContext, SidebarFooter (+25 more)

### Community 4 - "App Architecture & Config"
Cohesion: 0.07
Nodes (36): Protected Routes pattern, Supabase realtime subscription, CLAUDE.md project guidance, hooks, PreToolUse, AppNavbar shared navigation, courseColor() cross-page utility, DB tables: courses, calendar_entries, calendar_todos, share_tokens (+28 more)

### Community 5 - "Dev Toolchain"
Cohesion: 0.06
Nodes (34): devDependencies, autoprefixer, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, jsdom (+26 more)

### Community 6 - "Toast State Machine"
Cohesion: 0.11
Nodes (26): Action, ActionType, actionTypes, addToRemoveQueue(), dispatch(), genId(), listeners, memoryState (+18 more)

### Community 7 - "Database Schema & RLS"
Cohesion: 0.10
Nodes (28): RLS per-user isolation pattern, Share token public read-only access pattern, SQL: create calendar_entries table, SQL: create calendar_todos + color col, SQL: create courses table, SQL: add user_id to courses + RLS, SQL: claim_orphan_courses trigger fn, SQL: update_updated_at_column trigger fn (+20 more)

### Community 8 - "Form & Overlay Primitives"
Cohesion: 0.10
Nodes (11): Checkbox, HoverCardContent, PopoverContent, Progress, ScrollArea, ScrollBar, Slider, Switch (+3 more)

### Community 9 - "Utility & Button Primitives"
Cohesion: 0.19
Nodes (15): cn(), ButtonProps, buttonVariants, Calendar(), CalendarProps, Pagination(), PaginationContent, PaginationEllipsis() (+7 more)

### Community 10 - "TypeScript App Config"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleDetection, moduleResolution (+10 more)

### Community 11 - "shadcn/ui Component Config"
Cohesion: 0.12
Nodes (16): aliases, components, hooks, lib, ui, utils, rsc, $schema (+8 more)

### Community 12 - "Form Components"
Cohesion: 0.19
Nodes (13): FormControl, FormDescription, FormField(), FormFieldContext, FormFieldContextValue, FormItem, FormItemContext, FormItemContextValue (+5 more)

### Community 13 - "TypeScript Node Config"
Cohesion: 0.14
Nodes (14): compilerOptions, allowImportingTsExtensions, isolatedModules, lib, module, moduleDetection, moduleResolution, noEmit (+6 more)

### Community 14 - "Carousel Component"
Cohesion: 0.14
Nodes (12): Carousel, CarouselApi, CarouselContent, CarouselContext, CarouselContextProps, CarouselItem, CarouselNext, CarouselOptions (+4 more)

### Community 15 - "Menubar Component"
Cohesion: 0.17
Nodes (11): Menubar, MenubarCheckboxItem, MenubarContent, MenubarItem, MenubarLabel, MenubarRadioItem, MenubarSeparator, MenubarShortcut() (+3 more)

### Community 16 - "Chart Components"
Cohesion: 0.29
Nodes (9): ChartConfig, ChartContainer, ChartContext, ChartContextProps, ChartLegendContent, ChartStyle(), ChartTooltipContent, THEMES (+1 more)

### Community 17 - "Dropdown Menu"
Cohesion: 0.20
Nodes (9): DropdownMenuCheckboxItem, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuShortcut(), DropdownMenuSubContent (+1 more)

### Community 18 - "Context Menu"
Cohesion: 0.20
Nodes (9): ContextMenuCheckboxItem, ContextMenuContent, ContextMenuItem, ContextMenuLabel, ContextMenuRadioItem, ContextMenuSeparator, ContextMenuShortcut(), ContextMenuSubContent (+1 more)

### Community 19 - "TypeScript Base Config"
Cohesion: 0.22
Nodes (9): compilerOptions, allowJs, noImplicitAny, noUnusedLocals, noUnusedParameters, paths, skipLibCheck, strictNullChecks (+1 more)

### Community 20 - "TS Project References"
Cohesion: 0.22
Nodes (6): include, files, include, references, lovable-tagger dev tool, Vite config

### Community 21 - "Alert Dialog"
Cohesion: 0.22
Nodes (8): AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter(), AlertDialogHeader(), AlertDialogOverlay, AlertDialogTitle

### Community 22 - "Sheet Overlay"
Cohesion: 0.25
Nodes (8): SheetContent, SheetContentProps, SheetDescription, SheetFooter(), SheetHeader(), SheetOverlay, SheetTitle, sheetVariants

### Community 23 - "Data Table"
Cohesion: 0.22
Nodes (8): Table, TableBody, TableCaption, TableCell, TableFooter, TableHead, TableHeader, TableRow

### Community 24 - "Toggle Group"
Cohesion: 0.25
Nodes (7): ToggleGroup, ToggleGroupContext, ToggleGroupItem, Toggle, toggleVariants, ToggleGroup, ToggleGroupContext

### Community 25 - "shadcn Wrapper Concepts"
Cohesion: 0.25
Nodes (8): AlertDialog component, AspectRatio component, Card component, Popover component, Progress component, Slider component, Tabs component, shadcn/radix UI wrapper pattern

### Community 26 - "Breadcrumb Navigation"
Cohesion: 0.25
Nodes (7): Breadcrumb, BreadcrumbEllipsis(), BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator()

### Community 27 - "Navigation Menu"
Cohesion: 0.25
Nodes (7): NavigationMenu, NavigationMenuContent, NavigationMenuIndicator, NavigationMenuList, NavigationMenuTrigger, navigationMenuTriggerStyle, NavigationMenuViewport

### Community 28 - "Drawer Overlay"
Cohesion: 0.29
Nodes (7): Drawer(), DrawerContent, DrawerDescription, DrawerFooter(), DrawerHeader(), DrawerOverlay, DrawerTitle

### Community 29 - "Card Component"
Cohesion: 0.29
Nodes (6): Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle

### Community 30 - "OpenSpec Workflow"
Cohesion: 0.33
Nodes (6): OpenSpec change workflow, openspec-apply-change skill definition, OPSX Apply command, OPSX Archive command, OPSX Explore command, OPSX Propose command

### Community 31 - "OTP Input"
Cohesion: 0.40
Nodes (4): InputOTP, InputOTPGroup, InputOTPSeparator, InputOTPSlot

### Community 32 - "Alert Component"
Cohesion: 0.50
Nodes (4): Alert, AlertDescription, AlertTitle, alertVariants

### Community 33 - "OpenSpec Skills"
Cohesion: 0.83
Nodes (4): openspec-archive-change skill, openspec-explore skill, openspec-propose skill, OpenSpec workflow

### Community 34 - "Avatar Component"
Cohesion: 0.50
Nodes (3): Avatar, AvatarFallback, AvatarImage

### Community 35 - "Accordion Component"
Cohesion: 0.50
Nodes (3): AccordionContent, AccordionItem, AccordionTrigger

### Community 36 - "Badge Component"
Cohesion: 0.67
Nodes (3): Badge(), BadgeProps, badgeVariants

## Knowledge Gaps
- **405 isolated node(s):** `target`, `lib`, `module`, `skipLibCheck`, `moduleResolution` (+400 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **29 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `cn()` connect `Utility & Button Primitives` to `Navigation & Auth UI`, `Course & Calendar Data`, `Sidebar & Input Primitives`, `Toast State Machine`, `Form & Overlay Primitives`, `Form Components`, `Carousel Component`, `Menubar Component`, `Chart Components`, `Dropdown Menu`, `Context Menu`, `Alert Dialog`, `Sheet Overlay`, `Data Table`, `Toggle Group`, `Breadcrumb Navigation`, `Navigation Menu`, `Drawer Overlay`, `Card Component`, `OTP Input`, `Alert Component`, `Avatar Component`, `Accordion Component`, `Badge Component`, `Radio Group`, `Textarea Input`?**
  _High betweenness centrality (0.167) - this node is a cross-community bridge._
- **Why does `dependencies` connect `NPM Runtime Dependencies` to `Dev Toolchain`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **Why does `Index()` connect `Course & Calendar Data` to `Navigation & Auth UI`, `Database Schema & RLS`?**
  _High betweenness centrality (0.014) - this node is a cross-community bridge._
- **What connects `target`, `lib`, `module` to the rest of the system?**
  _407 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Navigation & Auth UI` be split into smaller, more focused modules?**
  _Cohesion score 0.05807622504537205 - nodes in this community are weakly interconnected._
- **Should `NPM Runtime Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.037037037037037035 - nodes in this community are weakly interconnected._
- **Should `Course & Calendar Data` be split into smaller, more focused modules?**
  _Cohesion score 0.058001397624039136 - nodes in this community are weakly interconnected._