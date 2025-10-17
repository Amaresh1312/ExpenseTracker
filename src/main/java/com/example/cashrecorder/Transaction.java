package com.example.cashrecorder;

import jakarta.persistence.*;
import org.hibernate.annotations.GenericGenerator;
import java.time.LocalDate;

/**
 * Represents a transaction entity for the cashbook.
 */
@Entity
@Table(name = "\"transaction\"")
public class Transaction {
    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    @GenericGenerator(name = "increment", strategy = "increment")
    private Long id;

    @Column(nullable = false)
    private Double amount;

    @Column(nullable = false)
    private String type; // "credit" or "debit"

    private String category;
    private String description;

    @Column(nullable = false)
    private LocalDate date;

    public Transaction() {}

    public Transaction(Double amount, String type, String category, String description, LocalDate date) {
        this.amount = amount;
        this.type = type;
        this.category = category;
        this.description = description;
        this.date = date;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Double getAmount() { return amount; }
    public void setAmount(Double amount) { this.amount = amount; }
    public String getType() { return type; }
    public void setType(String type) { this.type = type; }
    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    public LocalDate getDate() { return date; }
    public void setDate(LocalDate date) { this.date = date; }
}
