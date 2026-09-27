(() => {
  const normalize = (text) => text.replace(/\s+/g, ' ').trim().toLowerCase();

  const enhance = (root) => {
    if (root.dataset.enhanced === 'true') return;

    const source = root.querySelector('[data-p10-faq-source]');
    const groups = root.querySelector('[data-p10-faq-groups]');
    const itemTemplate = root.querySelector('template[data-p10-faq-item]');
    const definitions = Array.from(root.querySelectorAll('template[data-p10-faq-question]'));
    const groupTemplates = Array.from(root.querySelectorAll('template[data-p10-faq-group]'));
    if (!source || !groups || !itemTemplate || !definitions.length || !groupTemplates.length) return;

    const definitionsByHeading = new Map(definitions.map((definition) => [normalize(definition.dataset.sourceQuestion), definition]));
    const headings = Array.from(source.querySelectorAll('h2'));
    if (headings.length !== definitions.length || headings.some((heading) => heading.parentElement !== source)) return;

    const answers = new Map();
    let currentAnswer;
    for (const node of source.childNodes) {
      if (node.nodeType === 1 && node.tagName === 'H2') {
        const definition = definitionsByHeading.get(normalize(node.textContent));
        if (!definition || answers.has(definition.dataset.p10FaqQuestion)) return;
        currentAnswer = [];
        answers.set(definition.dataset.p10FaqQuestion, currentAnswer);
      } else if (currentAnswer) {
        currentAnswer.push(node);
      }
    }
    if (answers.size !== definitions.length || Array.from(answers.values()).some((nodes) => !nodes.some((node) => node.nodeType === 1 || node.textContent.trim()))) return;

    const fragment = document.createDocumentFragment();
    const pendingAnswers = [];
    for (const groupTemplate of groupTemplates) {
      const group = groupTemplate.content.firstElementChild.cloneNode(true);
      for (const definition of definitions.filter((item) => item.dataset.group === groupTemplate.dataset.p10FaqGroup)) {
        const questionId = definition.dataset.p10FaqQuestion;
        const item = itemTemplate.content.firstElementChild.cloneNode(true);
        item.dataset.question = questionId;
        item.querySelector('[data-p10-faq-label]').textContent = definition.dataset.label;
        item.open = root.dataset.mode === 'page' && (questionId === 'boxes' || questionId === 'packing');
        pendingAnswers.push([item.querySelector('.p10-faq__answer'), answers.get(questionId)]);
        group.append(item);
      }
      fragment.append(group);
    }

    pendingAnswers.forEach(([answer, nodes]) => answer.append(...nodes));
    groups.replaceChildren(fragment);
    groups.hidden = false;
    source.hidden = true;
    root.dataset.enhanced = 'true';
  };

  const initialize = (container) => {
    if (container.matches?.('[data-p10-faq]')) enhance(container);
    container.querySelectorAll('[data-p10-faq]').forEach(enhance);
  };

  initialize(document);
  document.addEventListener('shopify:section:load', (event) => initialize(event.target));
})();
