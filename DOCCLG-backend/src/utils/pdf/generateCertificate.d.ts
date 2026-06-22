interface GenerateCertificateParams {
    studentName: string;
    documentType: string;
    certificateId: string;
    requestId: string;
    course?: string;
    branch?: string;
    yearOfStudy?: string;
    academicSession?: string;
    semester?: string;
    attendancePercentage?: number | undefined;
    purpose?: string;
}
export declare const generateCertificate: ({ studentName, documentType, certificateId, requestId, course, branch, yearOfStudy, academicSession, semester, attendancePercentage, purpose, }: GenerateCertificateParams) => Promise<string>;
export {};
//# sourceMappingURL=generateCertificate.d.ts.map