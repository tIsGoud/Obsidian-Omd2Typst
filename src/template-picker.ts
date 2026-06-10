import { App, SuggestModal } from 'obsidian';
import type { TemplateEntry, Omd2TypstSettings } from './settings';

type TemplateChoice = { label: string; entry: TemplateEntry | null };

export class TemplateSuggestModal extends SuggestModal<TemplateChoice> {
  private items: TemplateChoice[];
  private onPick: (entry: TemplateEntry | null) => void;

  constructor(
    app: App,
    settings: Omd2TypstSettings,
    onPick: (entry: TemplateEntry | null) => void,
  ) {
    super(app);
    this.onPick = onPick;
    const choices: TemplateChoice[] = [];
    if (settings.showBuiltinInPicker) {
      choices.push({ label: 'Built-in', entry: null });
    }
    for (const tpl of settings.templates) {
      choices.push({ label: tpl.name, entry: tpl });
    }
    this.items = choices;
  }

  getSuggestions(_query: string): TemplateChoice[] {
    return this.items;
  }

  renderSuggestion(choice: TemplateChoice, el: HTMLElement): void {
    el.setText(choice.label);
  }

  onChooseSuggestion(choice: TemplateChoice, _evt: MouseEvent | KeyboardEvent): void {
    this.onPick(choice.entry);
  }
}
