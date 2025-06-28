import {Request, Response} from "express";
import { LinkPrecedence, Prisma, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createNewContact(
    email: string, 
    phoneNumber: string, 
    linkPrecedence: LinkPrecedence,
    linkedId?: number
) {
    const newContact = await prisma.contact.create({
        data: {
            email,
            phoneNumber,
            linkPrecedence,
            linkedId: linkedId || null,
        }
    })

    return newContact;
}

const createContatctResponse = async (primaryContactId: number) => {
    const primaryContact = await prisma.contact.findUnique({
        where: { id: primaryContactId }
    });

    const secondaryContacts = await prisma.contact.findMany({
        where: { linkedId: primaryContactId },
        orderBy: { createdAt: 'asc' }
    });

    const allContacts = [primaryContact, ...secondaryContacts];

    const emails = [...new Set(allContacts.map(c => c?.email).filter(Boolean))];
    const phoneNumbers = [...new Set(allContacts.map(c => c?.phoneNumber).filter(Boolean))];
    const secondaryContactIds = secondaryContacts.map(c => c.id);

    return {
        contact: {
            primaryContactId: primaryContactId,
            emails,
            phoneNumbers,
            secondaryContactIds,
        }
    };
}

const identifyContact = async (req: Request, res: Response):Promise<any> => {
    const { email, phoneNumber } = req.body || null;

    if (!email && !phoneNumber) {
        return res.status(400).json({ error: "Please provide either an email or a phone number" });
    }

    try {

        const conditions: Prisma.ContactWhereInput[] = [];

        if (email) conditions.push({ email });
        if (phoneNumber) conditions.push({ phoneNumber });

        const matchingContact = await prisma.contact.findMany({
            where: {
                OR: conditions
            },
            orderBy: { createdAt: "asc" }
        })

        // Case 1 no cnotact found

        if (matchingContact.length === 0) {
            const newPrimaryContact = await createNewContact(
                email, 
                phoneNumber, 
                LinkPrecedence.primary)

            return res.status(200).json({
                contact: {
                    primaryContactId: newPrimaryContact.id,
                    emails: [newPrimaryContact.email].filter(Boolean),
                    phoneNumbers: [newPrimaryContact.phoneNumber].filter(Boolean),
                    secondaryContactIds: [],
                },
            });
        }

        // case 2 both contact matching 

        const bothMatchingContact = matchingContact.find(contact => 
            contact.email === email && contact.phoneNumber === phoneNumber
        );

        if (bothMatchingContact) {
            const primaryId = bothMatchingContact.linkPrecedence === LinkPrecedence.primary 
                ? bothMatchingContact.id 
                : bothMatchingContact.linkedId!;
            
            const response = await createContatctResponse(primaryId);
            return res.status(200).json(response);
        }

        // for case 3 and 4

        const matchingEmailContact = matchingContact.filter(c => c.email === email);
        const matchingPhoneContact = matchingContact.filter(c => c.phoneNumber === phoneNumber);

        const primaryEmailContactIds = matchingEmailContact.map(contact => contact.linkPrecedence === LinkPrecedence.primary ? contact.id : contact.linkedId!);
        const primaryPhoneContactIds = matchingPhoneContact.map(contact => contact.linkPrecedence === LinkPrecedence.primary ? contact.id : contact.linkedId!);
    
        const allPrimaryContactIds = [...primaryEmailContactIds, ...primaryPhoneContactIds];
        const uniquePrimaryContactIds = [...new Set(allPrimaryContactIds)];


        if (uniquePrimaryContactIds.length === 1) {
            const primaryContactId = uniquePrimaryContactIds[0];

            const existingGroup = await prisma.contact.findMany({
                where: {
                    OR: [
                        { id: primaryContactId },
                        { linkedId: primaryContactId }
                    ]
                }
            });

            let shouldCreateNew = false;

            if (email && phoneNumber) {
                const exactMatch = existingGroup.find(contact => 
                    contact.email === email && contact.phoneNumber === phoneNumber
                );
                if (exactMatch) {
                    const response = await createContatctResponse(primaryContactId);
                    return res.status(200).json(response);
                }
                
                const emailExists = existingGroup.some(contact => contact.email === email);
                const phoneExists = existingGroup.some(contact => contact.phoneNumber === phoneNumber);
                
                if (emailExists && phoneExists) {
                    const response = await createContatctResponse(primaryContactId);
                    return res.status(200).json(response);
                }
                shouldCreateNew = true;
            } else if (email) {
                const emailExists = existingGroup.some(contact => contact.email === email);
                if (emailExists) {
                    const response = await createContatctResponse(primaryContactId);
                    return res.status(200).json(response);
                }
                shouldCreateNew = true;
            } else if (phoneNumber) {
                const phoneExists = existingGroup.some(contact => contact.phoneNumber === phoneNumber);
                if (phoneExists) {
                    const response = await createContatctResponse(primaryContactId);
                    return res.status(200).json(response);
                }
                shouldCreateNew = true;
            }

            if (shouldCreateNew) {
                await createNewContact(
                    email, 
                    phoneNumber, 
                    LinkPrecedence.secondary, 
                    primaryContactId);

                const response = await createContatctResponse(primaryContactId);
                return res.status(200).json(response);
            }
        }

        if (uniquePrimaryContactIds.length === 2) {
            const [primaryContactId_1, primaryContactId_2] = uniquePrimaryContactIds;

            const primaryContact_1 = await prisma.contact.findUnique({
                where: { id: primaryContactId_1 }
            });

            const primaryContact_2 = await prisma.contact.findUnique({
                where: { id: primaryContactId_2 }
            });

            const oldPrimaryContact = primaryContact_1!.createdAt <= primaryContact_2!.createdAt ? primaryContact_1! : primaryContact_2!;
            const newPrimaryContact = primaryContact_1!.createdAt <= primaryContact_2!.createdAt ? primaryContact_2! : primaryContact_1!;

            await prisma.contact.update({
                where: { id: newPrimaryContact.id },
                data: {
                    linkPrecedence: LinkPrecedence.secondary,
                    linkedId: oldPrimaryContact.id
                }
            });

            await prisma.contact.updateMany({
                where: { linkedId: newPrimaryContact.id },
                data: { linkedId: oldPrimaryContact.id }
            });

            await createNewContact(email, phoneNumber, LinkPrecedence.secondary, oldPrimaryContact.id);

            const response = await createContatctResponse(oldPrimaryContact.id);
            return res.status(200).json(response);
            
        }
    } catch (error) {
        console.error('Error in identifyContact:', error);
        return res.status(500).json({ error: "Internal server errorz" });
    }

};

export default identifyContact;