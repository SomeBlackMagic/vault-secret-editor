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
            // https://github.com/Qarik-Group/safe/issues/238
            if (content[key] === false) {
                content[key] = 'false';
            }
            if (content[key] === true) {
                content[key] = 'true';
            }

        }

        return content;
    }

}