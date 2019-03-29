<?php
/**
 * BSS Commerce Co.
 *
 * NOTICE OF LICENSE
 *
 * This source file is subject to the EULA
 * that is bundled with this package in the file LICENSE.txt.
 * It is also available through the world-wide-web at this URL:
 * http://bsscommerce.com/Bss-Commerce-License.txt
 *
 * =================================================================
 *                 MAGENTO EDITION USAGE NOTICE
 * =================================================================
 * This package designed for Magento COMMUNITY edition
 * BSS Commerce does not guarantee correct work of this extension
 * on any other Magento edition except Magento COMMUNITY edition.
 * BSS Commerce does not provide extension support in case of
 * incorrect edition usage.
 * =================================================================
 *
 * @category   BSS
 * @package    Bss_FastOrder
 * @author     Extension Team
 * @copyright  Copyright (c) 2015-2016 BSS Commerce Co. ( http://bsscommerce.com )
 * @license    http://bsscommerce.com/Bss-Commerce-License.txt
 */
namespace Bss\FastOrder\Model\Product;

class Option
{
    /**
     * Product text options group.
     */
    const OPTION_GROUP_TEXT = 'text';

    /**
     * Product file options group.
     */
    const OPTION_GROUP_FILE = 'file';

    /**
     * Product select options group.
     */
    const OPTION_GROUP_SELECT = 'select';

    /**
     * Product date options group.
     */
    const OPTION_GROUP_DATE = 'date';

    /**
     * Product field option type.
     */
    const OPTION_TYPE_FIELD = 'field';

    /**
     * Product area option type.
     */
    const OPTION_TYPE_AREA = 'area';

    /**
     * Product file option type.
     */
    const OPTION_TYPE_FILE = 'file';

    /**
     * Product drop-down option type.
     */
    const OPTION_TYPE_DROP_DOWN = 'drop_down';

    /**
     * Product radio option type.
     */
    const OPTION_TYPE_RADIO = 'radio';

    /**
     * Product checkbox option type.
     */
    const OPTION_TYPE_CHECKBOX = 'checkbox';

    /**
     * Product multiple option type.
     */
    const OPTION_TYPE_MULTIPLE = 'multiple';

    /**
     * Product date option type.
     */
    const OPTION_TYPE_DATE = 'date';

    /**
     * Product datetime option type.
     */
    const OPTION_TYPE_DATE_TIME = 'date_time';

    /**
     * Product time option type.
     */
    const OPTION_TYPE_TIME = 'time';
}
