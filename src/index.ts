
export const handler = async (event) => {
  for (const record of event.Records) {
    const messageAttributes = record.messageAttributes;
    const messageBody = record.body;
    // const docId = messageBody.docId;
    // TODO: DB에서 Docid를 통해 가져오기
    console.log(messageBody);
  }
};
