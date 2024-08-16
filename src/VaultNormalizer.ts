export default class VaultNormalizer {
    public static denormilize(key: string, value: any| Object): any {
        if (key !== '') {
            if (typeof value === 'string' && isNaN(parseInt(value))) {
                try {
                    return JSON.parse(value);
                } catch (e) {
                    return value;
                }
            }
        }

        return value;
    }

    public static normilize(content: Object): any {
        for (const key in content) {
            if (content.hasOwnProperty(key)) {
                if (typeof content[key] === 'object' && content[key] !== null) {
                    content[key] = JSON.stringify(content[key]);
                }
            }
        }

        return content;
    }

}