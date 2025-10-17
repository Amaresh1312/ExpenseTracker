// script.js
document.addEventListener('DOMContentLoaded', () => {
    // --- API Configuration ---
    const API_URL = 'http://localhost:8080/api/transactions';

    // --- DOM Element Selections ---
    const transactionForm = document.getElementById('transaction-form');
    const descriptionInput = document.getElementById('description');
    const amountInput = document.getElementById('amount');
    const typeInput = document.getElementById('type');
    const categoryInput = document.getElementById('category');
    const dateInput = document.getElementById('date');
    const transactionList = document.getElementById('transaction-list');
    const sortSelect = document.getElementById('sort-select');
    const filterSelect = document.getElementById('filter-select');
    const searchInput = document.getElementById('search-input');
    const creditAmountEl = document.getElementById('credit-amount');
    const debitAmountEl = document.getElementById('debit-amount');
    const balanceAmountEl = document.getElementById('balance-amount');
    const pdfBtn = document.getElementById('pdf-btn');
    const modal = document.getElementById('edit-modal');
    const closeBtn = document.querySelectorAll('.close-btn');
    const editForm = document.getElementById('edit-form');
    const editId = document.getElementById('edit-id');
    const editDescription = document.getElementById('edit-description');
    const editAmount = document.getElementById('edit-amount');
    const editType = document.getElementById('edit-type');
    const editCategory = document.getElementById('edit-category');
    const editDate = document.getElementById('edit-date');
    const alertArea = document.getElementById('alert-area');
    const backendStatusEl = document.getElementById('backend-status');

    // --- State Management ---
    let transactions = [];
    let summaryChart = null;

    // --- Helper to show success/fail alerts ---
    function showAlert(message, type='success') {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
        alertDiv.role = 'alert';
        alertDiv.innerHTML = `
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        alertArea.appendChild(alertDiv);
        setTimeout(() => alertDiv.remove(), 4000);
    }

    // --- API Functions ---
    const fetchTransactions = async () => {
        try {
            const response = await fetch(API_URL);
            if (!response.ok) throw new Error('Non-OK response');
            transactions = await response.json();
            setBackendStatus(true);
            console.log('Fetched transactions:', transactions);
            updateUI();
            console.log('UI updated after fetch');
        } catch (error) {
            setBackendStatus(false);
            showAlert('Could not fetch transactions. Working in offline mode.', 'warning');
        }
    };

    // Backend health check and UI update
    const setBackendStatus = (isUp) => {
        if (!backendStatusEl) return;
        if (isUp) {
            backendStatusEl.textContent = 'Backend: Online';
            backendStatusEl.className = 'badge bg-success';
        } else {
            backendStatusEl.textContent = 'Backend: Offline';
            backendStatusEl.className = 'badge bg-danger';
        }
    };

    const checkBackend = async () => {
        try {
            const resp = await fetch(API_URL, { method: 'HEAD' });
            setBackendStatus(resp.ok);
        } catch {
            setBackendStatus(false);
        }
    };

    const addTransactionAPI = async (transaction) => {
        try {
            const resp = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transaction),
            });
            if (resp.ok){
                showAlert('Transaction added!');
                fetchTransactions();
            } else {
                showAlert('Failed to add transaction.', 'danger');
            }
        } catch {
            showAlert('Server error adding transaction.', 'danger');
        }
    };

    const updateTransactionAPI = async (id, transaction) => {
        try {
            const resp = await fetch(`${API_URL}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(transaction),
            });
            if (resp.ok){
                showAlert('Transaction edited!');
                fetchTransactions();
            } else {
                showAlert('Failed to edit transaction.', 'danger');
            }
        } catch {
            showAlert('Server error editing transaction.', 'danger');
        }
    };

    const deleteTransactionAPI = async (id) => {
        if (confirm('Are you sure you want to delete this transaction?')) {
            try {
                const resp = await fetch(`${API_URL}/${id}`, { method: 'DELETE' });
                if (resp.ok){
                    showAlert('Transaction deleted!');
                    fetchTransactions();
                } else {
                    showAlert('Failed to delete transaction.', 'danger');
                }
            } catch {
                showAlert('Server error deleting transaction.', 'danger');
            }
        }
    };


    // --- Event Handlers ---
    const addTransaction = (e) => {
        e.preventDefault();
        const newTransaction = {
            description: descriptionInput.value,
            amount: parseFloat(amountInput.value),
            type: typeInput.value,
            category: categoryInput.value,
            date: dateInput.value
        };
        addTransactionAPI(newTransaction);
        transactionForm.reset();
        setDefaultDate();
    };

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        const id = editId.value;
        const updatedTransaction = {
            description: editDescription.value,
            amount: parseFloat(editAmount.value),
            type: editType.value,
            category: editCategory.value,
            date: editDate.value
        };
        await updateTransactionAPI(id, updatedTransaction);
        closeEditModal();
    };

    // --- UI Rendering Functions ---
    const renderTransactions = () => {
        transactionList.innerHTML = '';
        if (transactions.length === 0) {
            transactionList.innerHTML = '<tr><td colspan="5" class="text-center">No transactions yet.</td></tr>';
            return;
        }
        // Apply category filter (default all)
        const selectedCategory = filterSelect ? filterSelect.value : 'all';
        const searchText = searchInput ? searchInput.value.trim().toLowerCase() : '';
        const filtered = selectedCategory && selectedCategory !== 'all'
            ? transactions.filter(t => t.category === selectedCategory)
            : [...transactions];
        // Apply description search
        const afterSearch = searchText ? filtered.filter(t => (t.description || '').toLowerCase().includes(searchText)) : filtered;

        // Determine sort mode from select (default to date-desc)
    const mode = sortSelect ? sortSelect.value : 'date-desc';
    const sorted = afterSearch.sort((a, b) => {
            switch (mode) {
                case 'date-asc':
                    return new Date(a.date) - new Date(b.date);
                case 'date-desc':
                    return new Date(b.date) - new Date(a.date);
                case 'amount-asc':
                    return a.amount - b.amount;
                case 'amount-desc':
                    return b.amount - a.amount;
                case 'category-asc':
                    return a.category.localeCompare(b.category);
                case 'category-desc':
                    return b.category.localeCompare(a.category);
                default:
                    return new Date(b.date) - new Date(a.date);
            }
        });
        sorted.forEach(t => {
            const sign = t.type === 'credit' ? '+' : '-';
            const amountClass = t.type === 'credit' ? 'text-success' : 'text-danger';
            const tableRow = document.createElement('tr');
            tableRow.innerHTML = `
                <td>${t.description}</td>
                <td>${new Date(t.date).toLocaleDateString()}</td>
                <td><span class="badge bg-secondary">${t.category}</span></td>
                <td class="${amountClass}">${sign}₹${t.amount.toFixed(2)}</td>
                <td>
                    <button class="btn btn-sm btn-outline-primary edit-btn" title="Edit">✏️</button>
                    <button class="btn btn-sm btn-outline-danger delete-btn" title="Delete">🗑️</button>
                </td>
            `;
            tableRow.querySelector('.edit-btn').addEventListener('click', () => openEditModal(t.id));
            tableRow.querySelector('.delete-btn').addEventListener('click', () => deleteTransactionAPI(t.id));
            transactionList.appendChild(tableRow);
        });
        // Update chart to reflect current filtered/sorted set
        updateChart(sorted);
    };

    // Populate filter-select with categories from the add-transaction category select
    const populateCategoryFilter = () => {
        if (!filterSelect) return;
        // Grab categories from the form's category select
        const categoryOptions = Array.from(document.getElementById('category').options)
            .map(o => o.value);
        // Clear existing (except the 'all' option)
        filterSelect.innerHTML = '<option value="all">All Categories</option>' +
            categoryOptions.map(c => `<option value="${c}">${c}</option>`).join('');
    // restore previously selected filter from storage
    const savedFilter = localStorage.getItem('cashrecorder.filter');
    if (savedFilter) filterSelect.value = savedFilter;
    };

    const updateDashboard = () => {
        const credit = transactions.filter(t => t.type === 'credit').reduce((sum, t) => sum + t.amount, 0);
        const debit = transactions.filter(t => t.type === 'debit').reduce((sum, t) => sum + t.amount, 0);
        const balance = credit - debit;
    creditAmountEl.textContent = `₹${credit.toFixed(2)}`;
    debitAmountEl.textContent = `₹${debit.toFixed(2)}`;
    balanceAmountEl.textContent = `₹${balance.toFixed(2)}`;
    };

    const updateUI = () => {
        updateDashboard();
        renderTransactions();
    };

    // --- Charting ---
    const buildTimeseries = (items) => {
        // monthly buckets YYYY-MM
        const buckets = {};
        items.forEach(t => {
            const d = new Date(t.date);
            const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
            if (!buckets[key]) buckets[key] = { credit: 0, debit: 0 };
            if (t.type === 'credit') buckets[key].credit += t.amount;
            else buckets[key].debit += t.amount;
        });
        const keys = Object.keys(buckets).sort();
        return { keys, buckets };
    };

    const updateChart = (items) => {
        const { keys, buckets } = buildTimeseries(items);
        const labels = keys.map(k => {
            const [y,m] = k.split('-');
            return `${m}/${y}`;
        });
        const creditData = keys.map(k => (buckets[k]?.credit || 0));
        const debitData = keys.map(k => (buckets[k]?.debit || 0));
        const ctx = document.getElementById('summary-chart');
        if (!ctx) return;
        if (summaryChart) summaryChart.destroy();
        summaryChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    { label: 'Credit', data: creditData, backgroundColor: 'rgba(0,128,0,0.6)' },
                    { label: 'Debit', data: debitData, backgroundColor: 'rgba(220,53,69,0.6)' }
                ]
            },
            options: {
                responsive: true,
                scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true } }
            }
        });
    };


    // --- Modal Logic ---
    const openEditModal = (id) => {
        const transaction = transactions.find(t => t.id === id);
        if (!transaction) return;
        editId.value = transaction.id;
        editDescription.value = transaction.description;
        editAmount.value = transaction.amount;
        editType.value = transaction.type;
        editCategory.value = transaction.category;
        editDate.value = transaction.date;
        modal.classList.add('show');
        modal.style.display = "block";
    };

    const closeEditModal = () => {
        modal.classList.remove('show');
        modal.style.display = "none";
    };

    // --- PDF Generation (client-side) ---
    // Generate a PDF and return a Blob (does not auto-save)
    const buildPdfBlob = async () => {
        if (!transactions || transactions.length === 0) {
            showAlert('No transactions to include in PDF.', 'warning');
            return null;
        }
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();
        const title = 'Transaction Report';
        // We'll add the header after we compute the sorted set (so date range is available)

        // Prepare rows consistent with current rendering (apply current filter/sort)
        const selectedCategory = filterSelect ? filterSelect.value : 'all';
        const filtered = selectedCategory && selectedCategory !== 'all'
            ? transactions.filter(t => t.category === selectedCategory)
            : [...transactions];
        const mode = sortSelect ? sortSelect.value : 'date-desc';
        const sorted = filtered.sort((a, b) => {
            switch (mode) {
                case 'date-asc': return new Date(a.date) - new Date(b.date);
                case 'date-desc': return new Date(b.date) - new Date(a.date);
                case 'amount-asc': return a.amount - b.amount;
                case 'amount-desc': return b.amount - a.amount;
                case 'category-asc': return a.category.localeCompare(b.category);
                case 'category-desc': return b.category.localeCompare(a.category);
                default: return new Date(b.date) - new Date(a.date);
            }
        });

    // compute totals
        const totalCredit = sorted.filter(t => t.type === 'credit').reduce((s, t) => s + t.amount, 0);
        const totalDebit = sorted.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0);
        const balance = totalCredit - totalDebit;

        const head = [['Description', 'Date', 'Category', 'Amount']];
        const body = sorted.map(t => [t.description, new Date(t.date).toLocaleDateString(), t.category, parseFloat(t.amount).toFixed(2)]);

        // Add an empty row then totals row at the end of body to appear as a footer
        body.push(['', '', '','']);
        body.push(['Totals', '', '', '']);

        // Header: title, date range, active filters (placed above the table)
        doc.setFontSize(16);
        doc.text(title, 14, 16);
        doc.setFontSize(10);
        let headerY = 22;
        if (sorted.length > 0) {
            const dates = sorted.map(s => new Date(s.date)).sort((a,b)=>a-b);
            const first = dates[0].toLocaleDateString();
            const last = dates[dates.length-1].toLocaleDateString();
            doc.text(`Date Range: ${first} - ${last}`, 14, headerY);
            headerY += 6;
        }
        const activeFilters = [];
        if (filterSelect && filterSelect.value && filterSelect.value !== 'all') activeFilters.push(`Category=${filterSelect.value}`);
        if (sortSelect && sortSelect.value) activeFilters.push(`Sort=${sortSelect.value}`);
        if (activeFilters.length > 0) {
            doc.text(`Filters: ${activeFilters.join(', ')}`, 14, headerY);
            headerY += 6;
        }

        // Use autotable and color the amount cell based on transaction type; totals styled bold
        doc.autoTable({
            head: head,
            body: body,
            startY: headerY + 4,
            styles: { fontSize: 10 },
            didParseCell: function (data) {
                if (data.section === 'body') {
                    // if it's the totals row (last row)
                    if (data.row.index === body.length - 1) {
                        data.cell.styles.fontStyle = 'bold';
                        if (data.column.index === 3) {
                            data.cell.text = ['INR ' + balance.toFixed(2)];
                        }
                    } else if (data.row.index === body.length - 2) {
                        // empty spacer row - leave blank
                        data.cell.text = [''];
                    } else if (data.column.index === 3) {
                        const row = sorted[data.row.index];
                        if (row.type === 'credit') {
                            data.cell.styles.textColor = [0, 128, 0];
                        } else if (row.type === 'debit') {
                            data.cell.styles.textColor = [220, 53, 69];
                        }
                        data.cell.text = ['INR ' + parseFloat(row.amount).toFixed(2)];
                    }
                }
            }
        });

        // Add a small summary area below the table with totals
    const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY + 8 : doc.internal.pageSize.getHeight() - 30;
        doc.setFontSize(11);
        // Use INR prefix to avoid glyph issues
        doc.text(`Total Credit: INR ${totalCredit.toFixed(2)}`, 14, finalY);
        doc.text(`Total Debit: INR ${totalDebit.toFixed(2)}`, 80, finalY);
        doc.text(`Balance: INR ${balance.toFixed(2)}`, 140, finalY);

        const pdfBlob = doc.output('blob');
        return pdfBlob;
    };

    // Show preview modal for a given PDF blob using PDF.js
    const showPDFPreview = (blob) => {
        const modalEl = document.getElementById('pdf-preview-modal');
        const container = document.getElementById('pdf-preview-container');
        const downloadBtn = document.getElementById('download-pdf-btn');
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        container.innerHTML = '';
        const loadingTask = pdfjsLib.getDocument(url);
        loadingTask.promise.then(pdf => {
            const renderPage = (pageNum) => pdf.getPage(pageNum).then(page => {
                const viewport = page.getViewport({ scale: 1.25 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                canvas.style.display = 'block';
                canvas.style.margin = '10px auto';
                const renderContext = { canvasContext: context, viewport: viewport };
                return page.render(renderContext).promise.then(() => container.appendChild(canvas));
            });
            const promises = [];
            for (let i = 1; i <= pdf.numPages; i++) promises.push(renderPage(i));
            return Promise.all(promises);
        }).catch(err => {
            console.error('PDF.js render error', err);
            // Show friendly message and provide a direct download fallback
            container.innerHTML = '';
            const msg = document.createElement('div');
            msg.className = 'text-center p-3';
            msg.innerHTML = `
                <p class="text-danger">Failed to render PDF preview.</p>
                <p>You can download the PDF directly using the button below.</p>
            `;
            const fallbackBtn = document.createElement('button');
            fallbackBtn.className = 'btn btn-primary';
            fallbackBtn.textContent = 'Download PDF';
            fallbackBtn.addEventListener('click', () => {
                const a = document.createElement('a');
                a.href = url;
                a.download = 'transactions.pdf';
                document.body.appendChild(a);
                a.click();
                a.remove();
            });
            msg.appendChild(fallbackBtn);
            container.appendChild(msg);
        });

        downloadBtn.onclick = () => {
            const a = document.createElement('a');
            a.href = url;
            a.download = 'transactions.pdf';
            document.body.appendChild(a);
            a.click();
            a.remove();
        };

        // open modal
        modalEl.classList.add('show');
        modalEl.style.display = 'block';
        // close handlers
        modalEl.querySelectorAll('.close-pdf-preview').forEach(btn => btn.addEventListener('click', () => {
            modalEl.classList.remove('show');
            modalEl.style.display = 'none';
            container.innerHTML = '';
            URL.revokeObjectURL(url);
        }));
    };

    // Hook the PDF button to build blob and preview
    pdfBtn.addEventListener('click', async (e) => {
        e.preventDefault();
        const blob = await buildPdfBlob();
        if (blob) showPDFPreview(blob);
    });

    const setDefaultDate = () => dateInput.value = new Date().toISOString().slice(0, 10);

    // --- Initialization ---
    const init = () => {
        transactionForm.addEventListener('submit', addTransaction);
        if (sortSelect) {
            // restore saved sort
            const savedSort = localStorage.getItem('cashrecorder.sort');
            if (savedSort) sortSelect.value = savedSort;
            sortSelect.addEventListener('change', () => {
                localStorage.setItem('cashrecorder.sort', sortSelect.value);
                updateUI();
            });
        }
        if (filterSelect) {
            filterSelect.addEventListener('change', () => {
                localStorage.setItem('cashrecorder.filter', filterSelect.value);
                updateUI();
            });
        }
        if (searchInput) {
            const savedSearch = localStorage.getItem('cashrecorder.search');
            if (savedSearch) searchInput.value = savedSearch;
            searchInput.addEventListener('input', () => {
                localStorage.setItem('cashrecorder.search', searchInput.value);
                updateUI();
            });
        }
        closeBtn.forEach(btn => btn.addEventListener('click', closeEditModal));
        window.addEventListener('click', (e) => e.target === modal ? closeEditModal() : false);
        editForm.addEventListener('submit', handleEditSubmit);
        setDefaultDate();
        populateCategoryFilter();
        // initial backend health check and polling
        checkBackend();
        setInterval(checkBackend, 30000);
        fetchTransactions();
    };

    init();
});
