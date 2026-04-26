const STORAGE_KEY = "freelancerProfile.v1";

const state = {
  items: [],
};

const el = {
  freelancerName: document.getElementById("freelancerName"),
  freelancerLogo: document.getElementById("freelancerLogo"),
  freelancerContact: document.getElementById("freelancerContact"),
  clientName: document.getElementById("clientName"),
  discountPercent: document.getElementById("discountPercent"),
  servicesBody: document.getElementById("servicesBody"),
  rowTemplate: document.getElementById("serviceRowTemplate"),
  addItemBtn: document.getElementById("addItemBtn"),
  printBtn: document.getElementById("printBtn"),
  subtotalValue: document.getElementById("subtotalValue"),
  discountValue: document.getElementById("discountValue"),
  totalValue: document.getElementById("totalValue"),
};

/**
 * Formata números no padrão monetário brasileiro.
 */
function formatCurrency(value) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/**
 * Persiste apenas os dados fixos do freelancer.
 * Assim o usuário não precisa preencher sempre ao abrir a ferramenta.
 */
function saveFreelancerProfile() {
  const profile = {
    name: el.freelancerName.value.trim(),
    logo: el.freelancerLogo.value.trim(),
    contact: el.freelancerContact.value.trim(),
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
}

/**
 * Carrega os dados do freelancer ao iniciar a aplicação.
 */
function loadFreelancerProfile() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return;

  try {
    const profile = JSON.parse(raw);
    el.freelancerName.value = profile.name || "";
    el.freelancerLogo.value = profile.logo || "";
    el.freelancerContact.value = profile.contact || "";
  } catch {
    localStorage.removeItem(STORAGE_KEY);
  }
}

/**
 * Soma subtotais e aplica desconto percentual.
 * - subtotal: soma(valor_unitario * quantidade) de todos itens
 * - desconto: subtotal * (percentual / 100)
 * - total: subtotal - desconto
 */
function calculateTotals() {
  const subtotal = state.items.reduce((acc, item) => acc + item.unitPrice * item.quantity, 0);
  const discountPercent = Number(el.discountPercent.value) || 0;
  const discount = subtotal * (discountPercent / 100);
  const total = subtotal - discount;

  el.subtotalValue.textContent = formatCurrency(subtotal);
  el.discountValue.textContent = `- ${formatCurrency(discount)}`;
  el.totalValue.textContent = formatCurrency(total);
}

/**
 * Re-renderiza todas as linhas para manter UI e estado sincronizados.
 */
function renderRows() {
  el.servicesBody.innerHTML = "";

  state.items.forEach((item, index) => {
    const rowFragment = el.rowTemplate.content.cloneNode(true);
    const row = rowFragment.querySelector("tr");
    const descriptionInput = row.querySelector('[data-field="description"]');
    const unitPriceInput = row.querySelector('[data-field="unitPrice"]');
    const quantityInput = row.querySelector('[data-field="quantity"]');
    const subtotalCell = row.querySelector("[data-subtotal]");
    const removeButton = row.querySelector('[data-action="remove"]');

    descriptionInput.value = item.description;
    unitPriceInput.value = item.unitPrice;
    quantityInput.value = item.quantity;
    subtotalCell.textContent = formatCurrency(item.unitPrice * item.quantity);

    descriptionInput.addEventListener("input", (event) => {
      state.items[index].description = event.target.value;
    });

    unitPriceInput.addEventListener("input", (event) => {
      state.items[index].unitPrice = Math.max(0, Number(event.target.value) || 0);
      subtotalCell.textContent = formatCurrency(
        state.items[index].unitPrice * state.items[index].quantity
      );
      calculateTotals();
    });

    quantityInput.addEventListener("input", (event) => {
      state.items[index].quantity = Math.max(1, Number(event.target.value) || 1);
      subtotalCell.textContent = formatCurrency(
        state.items[index].unitPrice * state.items[index].quantity
      );
      calculateTotals();
    });

    removeButton.addEventListener("click", () => {
      state.items.splice(index, 1);
      if (state.items.length === 0) addEmptyItem();
      renderRows();
      calculateTotals();
    });

    el.servicesBody.appendChild(rowFragment);
  });
}

function addEmptyItem() {
  state.items.push({
    description: "",
    unitPrice: 0,
    quantity: 1,
  });
}

function setupEvents() {
  el.addItemBtn.addEventListener("click", () => {
    addEmptyItem();
    renderRows();
    calculateTotals();
  });

  el.discountPercent.addEventListener("input", calculateTotals);

  // Salva os dados em tempo real para melhor experiência de uso.
  [el.freelancerName, el.freelancerLogo, el.freelancerContact].forEach((input) => {
    input.addEventListener("input", saveFreelancerProfile);
  });

  /**
   * A geração de PDF aqui usa o fluxo nativo do navegador:
   * abre a janela de impressão com layout otimizado pelo @media print.
   * O usuário escolhe "Salvar como PDF".
   */
  el.printBtn.addEventListener("click", () => window.print());
}

function init() {
  loadFreelancerProfile();
  addEmptyItem();
  setupEvents();
  renderRows();
  calculateTotals();
}

init();
