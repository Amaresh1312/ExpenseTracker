package com.example.cashrecorder;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import com.itextpdf.text.pdf.PdfPTable;
import com.itextpdf.text.pdf.PdfWriter;

import com.itextpdf.text.*;
import com.itextpdf.text.pdf.*;
import org.springframework.http.*;
import java.io.*;

import java.util.List;
import java.util.Map;
import java.util.HashMap;

@RestController
@RequestMapping("/api/transactions")
@CrossOrigin(origins = "*")  // Enable frontend access
public class TransactionController {

    @Autowired
    private TransactionRepository transactionRepository;

    @GetMapping
    public List<Transaction> getAllTransactions() {
        return transactionRepository.findAll();
    }

    @PostMapping
    public Transaction addTransaction(@RequestBody Transaction transaction) {
        return transactionRepository.save(transaction);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteTransaction(@PathVariable Long id) {
        if (!transactionRepository.existsById(id)) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body("Transaction with id " + id + " not found.");
        }
        transactionRepository.deleteById(id);
        return ResponseEntity.ok().body("Transaction deleted successfully.");
    }

    @GetMapping("/summary")
    public Map<String, Double> getSummary() {
        Double totalIncome = transactionRepository.getTotalIncome();
        Double totalExpenses = transactionRepository.getTotalExpenses();

        Map<String, Double> summary = new HashMap<>();
        summary.put("totalIncome", totalIncome != null ? totalIncome : 0.0);
        summary.put("totalExpenses", totalExpenses != null ? totalExpenses : 0.0);
        summary.put("balance", (totalIncome != null ? totalIncome : 0.0) - (totalExpenses != null ? totalExpenses : 0.0));
        return summary;
    }

    @GetMapping("/pdf")
    public ResponseEntity<byte[]> generatePdfReport() throws Exception {
        List<Transaction> data = transactionRepository.findAll();

        ByteArrayOutputStream out = new ByteArrayOutputStream();
        Document document = new Document();
        PdfWriter.getInstance(document, out);
        document.open();
        Paragraph title = new Paragraph("Cashbook Transactions Report");
        title.setSpacingAfter(20f);
        document.add(title);
        PdfPTable table = new PdfPTable(5);
        table.addCell("Description");
        table.addCell("Date");
        table.addCell("Category");
        table.addCell("Type");
        table.addCell("Amount");

        for (Transaction t : data) {
            table.addCell(t.getDescription());
            table.addCell(t.getDate().toString());
            table.addCell(t.getCategory());
            table.addCell(t.getType());
            table.addCell(String.format("%.2f", t.getAmount()));
        }
        document.add(table);
        document.close();

        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=transactions.pdf")
            .contentType(MediaType.APPLICATION_PDF)
            .body(out.toByteArray());
    }

    @PutMapping("/{id}")
    public ResponseEntity<Transaction> updateTransaction(@PathVariable Long id, @RequestBody Transaction updatedTransaction) {
        return transactionRepository.findById(id)
            .map(transaction -> {
                // Update only the amount, or other fields as needed
                transaction.setAmount(updatedTransaction.getAmount());
                transaction.setDescription(updatedTransaction.getDescription());
                transaction.setType(updatedTransaction.getType());
                transaction.setCategory(updatedTransaction.getCategory());
                transaction.setDate(updatedTransaction.getDate());
                Transaction saved = transactionRepository.save(transaction);
                return ResponseEntity.ok(saved);
            })
            .orElse(ResponseEntity.notFound().build());
    }
}

