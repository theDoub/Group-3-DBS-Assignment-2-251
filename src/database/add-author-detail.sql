-- Add ImageURL column to Author table
USE Assignment2_Bookstore_DB;

ALTER TABLE Author ADD COLUMN ImageURL VARCHAR(500) NULL AFTER Nationality;
