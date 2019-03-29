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
namespace Bss\FastOrder\Controller\Index;

use Magento\Framework\App\Action\Context;

class Search extends \Magento\Framework\App\Action\Action
{
    protected $helperBss;

    public function __construct(
        \Magento\Framework\App\Action\Context $context,
        \Bss\FastOrder\Helper\Data $helperBss,
        \Bss\FastOrder\Model\Search\Save $save
    ) {
        parent::__construct($context);
        $this->helperBss = $helperBss;
        $this->save = $save;
    }

    public function execute()
    {
        if (!$this->helperBss->getConfig('enabled')) {
            return false;
        }
        $inputRes = $this->getRequest()->getParam('product');
        if ($inputRes) {
            $respon = $this->save->getProductInfo($inputRes);
        } else {
            $respon = '';
        }
        $this->getResponse()->setBody($respon);
        return;
    }
}
