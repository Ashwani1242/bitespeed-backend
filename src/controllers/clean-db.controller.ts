import { Request, Response } from "express";
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const cleanDatabase = async (req: Request, res: Response): Promise<any> => {
    try {
        const deletedContacts = await prisma.contact.deleteMany({});
        
        return res.status(200).json({
            message: "Database cleaned successfully",
            deletedRecords: deletedContacts.count,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error("Error cleaning database:", error);
        return res.status(500).json({
            error: "Failed to clean database",
            message: error instanceof Error ? error.message : "Unknown error occurred"
        });
    }
};

export default cleanDatabase; 