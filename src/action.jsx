import ForgeUI, { render, Text, ContentAction, ModalDialog, useProductContext, useState, Table, Head, Cell, Row } from '@forge/ui';
import api from '@forge/api';

const URL = 'https://api.us-east.tone-analyzer.watson.cloud.ibm.com/instances/aaa27945-1fd2-4e7c-9248-c82f80f3a635';

async function getAnalysis(contentId) {
    const contentResponse = await api.asApp().requestConfluence(`/rest/api/content/${contentId}?expand=body.storage`);
    await checkResponse('Confluence API', contentResponse);
    const contentData = await contentResponse.json();
    const content = contentData.body.storage.value;

    const toneResponse = await api.fetch(`${URL}/v3/tone?version=2019-07-12`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${Buffer.from(`apikey:${process.env.TA_API_KEY}`).toString('base64')}`,
        },
        body: JSON.stringify({
            "toneInput": { 'html': content },
            "contentType": 'application/json',
            "sentences": false,
        })
    });
    await checkResponse('IBM Tone Analyzer API', toneResponse);
    const toneData = await toneResponse.json();
    return toneData.document_tone;
}

function showAnalysis(value) {
    const tones = value.tones;
    return (
        <Table>
            <Head>
                <Cell>
                    <Text content="Tone Name" />
                </Cell>
                <Cell>
                    <Text content="Tone Score" />
                </Cell>
            </Head>
            {tones.map(tone => <Row>
                <Cell>
                    <Text>{tone.tone_name}</Text>
                </Cell>
                <Cell>
                    <Text>{Math.round(tone.score * 10000) / 100}</Text>
                </Cell>
            </Row>)}
        </Table>
    )
}

const Action = () => {
    const [isOpen, setOpen] = useState(true)
    const { context, contentId } = useProductContext();
    const [value, setValue] = useState(getAnalysis(contentId));

    if (!isOpen) {
        return null;
    }

    return (
        <ModalDialog header="Document Tone Analysis" onClose={() => setOpen(false)}>
            {showAnalysis(value)}
        </ModalDialog>
    );
};

async function checkResponse(apiName, response) {
    if (!response.ok) {
        const message = `Error from ${apiName}: ${response.status} ${await response.text()}`;
        console.error(message);
        throw new Error(message);
    }
}

export const run = render(
    <ContentAction>
        <Action />
    </ContentAction>
);